import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ValidationError } from '@shared/common';
import { Counted, DomainName, EntityId, OperationType } from '@shared/domain/types';
import { isEmail, validateOrReject } from 'class-validator';
import { DeletionService, DomainDeletionReport } from '@shared/domain/interface';
import { DomainDeletionReportBuilder, DomainOperationReportBuilder } from '@shared/domain/builder';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { DataDeletedEvent, UserDeletedEvent } from '@modules/deletion';
import { LegacyLogger } from '../../../core/logger';
import { ServerConfig } from '../../server/server.config';
import { AccountServiceDb } from './account-db.service';
import { AccountServiceIdm } from './account-idm.service';
import { AbstractAccountService } from './account.service.abstract';
import { AccountValidationService } from './account.validation.service';
import { AccountDto, AccountSaveDto } from './dto';

@Injectable()
@EventsHandler(UserDeletedEvent)
export class AccountService extends AbstractAccountService implements DeletionService, IEventHandler<UserDeletedEvent> {
	private readonly accountImpl: AbstractAccountService;

	constructor(
		private readonly accountDb: AccountServiceDb,
		private readonly accountIdm: AccountServiceIdm,
		private readonly configService: ConfigService<ServerConfig, true>,
		private readonly accountValidationService: AccountValidationService,
		private readonly logger: LegacyLogger,
		private readonly eventBus: EventBus
	) {
		super();
		this.logger.setContext(AccountService.name);
		if (this.configService.get<boolean>('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED') === true) {
			this.accountImpl = accountIdm;
		} else {
			this.accountImpl = accountDb;
		}
	}

	public async handle({ deletionRequestId, targetRefId }: UserDeletedEvent): Promise<void> {
		const dataDeleted = await this.deleteUserData(targetRefId);
		await this.eventBus.publish(new DataDeletedEvent(deletionRequestId, dataDeleted));
	}

	async findById(id: string): Promise<AccountDto> {
		return this.accountImpl.findById(id);
	}

	async findMultipleByUserId(userIds: string[]): Promise<AccountDto[]> {
		return this.accountImpl.findMultipleByUserId(userIds);
	}

	async findByUserId(userId: string): Promise<AccountDto | null> {
		return this.accountImpl.findByUserId(userId);
	}

	async findByUserIdOrFail(userId: string): Promise<AccountDto> {
		return this.accountImpl.findByUserIdOrFail(userId);
	}

	async findByUsernameAndSystemId(username: string, systemId: string | ObjectId): Promise<AccountDto | null> {
		return this.accountImpl.findByUsernameAndSystemId(username, systemId);
	}

	async searchByUsernamePartialMatch(userName: string, skip: number, limit: number): Promise<Counted<AccountDto[]>> {
		return this.accountImpl.searchByUsernamePartialMatch(userName, skip, limit);
	}

	async searchByUsernameExactMatch(userName: string): Promise<Counted<AccountDto[]>> {
		return this.accountImpl.searchByUsernameExactMatch(userName);
	}

	async save(accountDto: AccountSaveDto): Promise<AccountDto> {
		const ret = await this.accountDb.save(accountDto);
		const newAccount: AccountSaveDto = {
			...accountDto,
			id: accountDto.id,
			idmReferenceId: ret.id,
			password: accountDto.password,
		};
		const idmAccount = await this.executeIdmMethod(async () => {
			this.logger.debug(`Saving account with accountID ${ret.id} ...`);
			const account = await this.accountIdm.save(newAccount);
			this.logger.debug(`Saved account with accountID ${ret.id}`);
			return account;
		});
		return { ...ret, idmReferenceId: idmAccount?.idmReferenceId };
	}

	async saveWithValidation(dto: AccountSaveDto): Promise<void> {
		await validateOrReject(dto);
		// sanatizeUsername ✔
		if (!dto.systemId) {
			dto.username = dto.username.trim().toLowerCase();
		}
		if (!dto.systemId && !dto.password) {
			throw new ValidationError('No password provided');
		}
		// validateUserName ✔
		// usernames must be an email address, if they are not from an external system
		if (!dto.systemId && !isEmail(dto.username)) {
			throw new ValidationError('Username is not an email');
		}
		// checkExistence ✔
		if (dto.userId && (await this.findByUserId(dto.userId))) {
			throw new ValidationError('Account already exists');
		}
		// validateCredentials hook will not be ported ✔
		// trimPassword hook will be done by class-validator ✔
		// local.hooks.hashPassword('password'), will be done by account service ✔
		// checkUnique ✔
		if (!(await this.accountValidationService.isUniqueEmail(dto.username, dto.userId, dto.id, dto.systemId))) {
			throw new ValidationError('Username already exists');
		}
		// removePassword hook is not implemented
		// const noPasswordStrategies = ['ldap', 'moodle', 'iserv'];
		// if (dto.passwordStrategy && noPasswordStrategies.includes(dto.passwordStrategy)) {
		// 	dto.password = undefined;
		// }

		await this.save(dto);
	}

	async updateUsername(accountId: string, username: string): Promise<AccountDto> {
		const ret = await this.accountDb.updateUsername(accountId, username);
		const idmAccount = await this.executeIdmMethod(async () => {
			this.logger.debug(`Updating username for account with accountID ${accountId} ...`);
			const account = await this.accountIdm.updateUsername(accountId, username);
			this.logger.debug(`Updated username for account with accountID ${accountId}`);
			return account;
		});
		return { ...ret, idmReferenceId: idmAccount?.idmReferenceId };
	}

	async updateLastTriedFailedLogin(accountId: string, lastTriedFailedLogin: Date): Promise<AccountDto> {
		const ret = await this.accountDb.updateLastTriedFailedLogin(accountId, lastTriedFailedLogin);
		const idmAccount = await this.executeIdmMethod(async () => {
			this.logger.debug(`Updating last tried failed login for account with accountID ${accountId} ...`);
			const account = await this.accountIdm.updateLastTriedFailedLogin(accountId, lastTriedFailedLogin);
			this.logger.debug(`Updated last tried failed login for account with accountID ${accountId}`);
			return account;
		});
		return { ...ret, idmReferenceId: idmAccount?.idmReferenceId };
	}

	async updatePassword(accountId: string, password: string): Promise<AccountDto> {
		const ret = await this.accountDb.updatePassword(accountId, password);
		const idmAccount = await this.executeIdmMethod(async () => {
			this.logger.debug(`Updating password for account with accountID ${accountId} ...`);
			const account = await this.accountIdm.updatePassword(accountId, password);
			this.logger.debug(`Updated password for account with accountID ${accountId}`);
			return account;
		});
		return { ...ret, idmReferenceId: idmAccount?.idmReferenceId };
	}

	async validatePassword(account: AccountDto, comparePassword: string): Promise<boolean> {
		return this.accountImpl.validatePassword(account, comparePassword);
	}

	async delete(accountId: string): Promise<void> {
		await this.accountDb.delete(accountId);
		await this.executeIdmMethod(async () => {
			this.logger.debug(`Deleting account with accountId ${accountId} ...`);
			await this.accountIdm.delete(accountId);
			this.logger.debug(`Deleted account with accountId ${accountId}`);
		});
	}

	async deleteByUserId(userId: string): Promise<EntityId[]> {
		const deletedAccounts = await this.accountDb.deleteByUserId(userId);
		await this.executeIdmMethod(async () => {
			this.logger.debug(`Deleting account with userId ${userId} ...`);
			const deletedAccountIdm = await this.accountIdm.deleteByUserId(userId);
			deletedAccounts.push(...deletedAccountIdm);
			this.logger.debug(`Deleted account with userId ${userId}`);
		});

		return deletedAccounts;
	}

	async deleteUserData(userId: EntityId): Promise<DomainDeletionReport> {
		this.logger.debug(`Start deleting data for userId - ${userId} in account collection`);
		const deletedAccounts = await this.deleteByUserId(userId);

		const result = DomainDeletionReportBuilder.build(DomainName.ACCOUNT, [
			DomainOperationReportBuilder.build(OperationType.DELETE, deletedAccounts.length, deletedAccounts),
		]);

		this.logger.debug(`Deleted data for userId - ${userId} from account collection`);

		return result;
	}

	/**
	 * @deprecated For migration purpose only
	 */
	async findMany(offset = 0, limit = 100): Promise<AccountDto[]> {
		return this.accountDb.findMany(offset, limit);
	}

	private async executeIdmMethod<T>(idmCallback: () => Promise<T>) {
		if (this.configService.get('FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED') === true) {
			try {
				return await idmCallback();
			} catch (error) {
				if (error instanceof Error) {
					this.logger.error(error, error.stack);
				} else {
					this.logger.error(error);
				}
			}
		}
		return null;
	}
}
