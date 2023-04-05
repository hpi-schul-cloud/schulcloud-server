import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ValidationError } from '@shared/common';
import { Counted } from '@shared/domain';
import { isEmail, validateOrReject } from 'class-validator';
import { Logger } from '../../../core/logger';
import { IServerConfig } from '../../server/server.config';
import { AccountServiceDb } from './account-db.service';
import { AccountServiceIdm } from './account-idm.service';
import { AbstractAccountService } from './account.service.abstract';
import { AccountValidationService } from './account.validation.service';
import { AccountDto, AccountSaveDto } from './dto';

@Injectable()
export class AccountService extends AbstractAccountService {
	constructor(
		private readonly accountDb: AccountServiceDb,
		private readonly accountIdm: AccountServiceIdm,
		private readonly configService: ConfigService<IServerConfig, true>,
		private readonly accountValidationService: AccountValidationService,
		private readonly logger: Logger
	) {
		super();
		this.logger.setContext(AccountService.name);
	}

	async findById(id: string): Promise<AccountDto> {
		if (this.configService.get<boolean>('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED') === true) {
			return this.accountIdm.findById(id);
		}
		return this.accountDb.findById(id);
	}

	async findMultipleByUserId(userIds: string[]): Promise<AccountDto[]> {
		if (this.configService.get<boolean>('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED') === true) {
			return this.accountIdm.findMultipleByUserId(userIds);
		}
		return this.accountDb.findMultipleByUserId(userIds);
	}

	async findByUserId(userId: string): Promise<AccountDto | null> {
		if (this.configService.get<boolean>('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED') === true) {
			return this.accountIdm.findByUserId(userId);
		}
		return this.accountDb.findByUserId(userId);
	}

	async findByUserIdOrFail(userId: string): Promise<AccountDto> {
		if (this.configService.get<boolean>('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED') === true) {
			return this.accountIdm.findByUserIdOrFail(userId);
		}
		return this.accountDb.findByUserIdOrFail(userId);
	}

	async findByUsernameAndSystemId(username: string, systemId: string | ObjectId): Promise<AccountDto | null> {
		if (this.configService.get<boolean>('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED') === true) {
			return this.accountIdm.findByUsernameAndSystemId(username, systemId);
		}
		return this.accountDb.findByUsernameAndSystemId(username, systemId);
	}

	async searchByUsernamePartialMatch(userName: string, skip: number, limit: number): Promise<Counted<AccountDto[]>> {
		if (this.configService.get<boolean>('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED') === true) {
			return this.accountIdm.searchByUsernamePartialMatch(userName, skip, limit);
		}
		return this.accountDb.searchByUsernamePartialMatch(userName, skip, limit);
	}

	async searchByUsernameExactMatch(userName: string): Promise<Counted<AccountDto[]>> {
		if (this.configService.get<boolean>('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED') === true) {
			return this.accountIdm.searchByUsernameExactMatch(userName);
		}
		return this.accountDb.searchByUsernameExactMatch(userName);
	}

	async save(accountDto: AccountSaveDto): Promise<AccountDto> {
		const ret = await this.accountDb.save(accountDto);
		const newAccount: AccountSaveDto = {
			...accountDto,
			id: accountDto.id,
			idmReferenceId: ret.id,
			password: accountDto.password,
		};
		const idmAccount = await this.executeIdmMethod(async () => this.accountIdm.save(newAccount));
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
		const idmAccount = await this.executeIdmMethod(async () => this.accountIdm.updateUsername(accountId, username));
		return { ...ret, idmReferenceId: idmAccount?.idmReferenceId };
	}

	async updateLastTriedFailedLogin(accountId: string, lastTriedFailedLogin: Date): Promise<AccountDto> {
		const ret = await this.accountDb.updateLastTriedFailedLogin(accountId, lastTriedFailedLogin);
		const idmAccount = await this.executeIdmMethod(async () =>
			this.accountIdm.updateLastTriedFailedLogin(accountId, lastTriedFailedLogin)
		);
		return { ...ret, idmReferenceId: idmAccount?.idmReferenceId };
	}

	async updatePassword(accountId: string, password: string): Promise<AccountDto> {
		const ret = await this.accountDb.updatePassword(accountId, password);
		const idmAccount = await this.executeIdmMethod(async () => this.accountIdm.updatePassword(accountId, password));
		return { ...ret, idmReferenceId: idmAccount?.idmReferenceId };
	}

	async delete(accountId: string): Promise<void> {
		await this.accountDb.delete(accountId);
		await this.executeIdmMethod(async () => this.accountIdm.delete(accountId));
	}

	async deleteByUserId(userId: string): Promise<void> {
		await this.accountDb.deleteByUserId(userId);
		await this.executeIdmMethod(async () => this.accountIdm.deleteByUserId(userId));
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
