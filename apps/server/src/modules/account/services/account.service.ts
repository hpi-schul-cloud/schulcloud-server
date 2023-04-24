import { ObjectId } from '@mikro-orm/mongodb';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { ValidationError } from '@shared/common';
import { isEmail, validateOrReject } from 'class-validator';
import { AccountServiceDb } from './account-db.service';
import { AccountServiceIdm } from './account-idm.service';
import { AbstractAccountService } from './account.service.abstract';
import { AccountDto, AccountSaveDto } from './dto';
import { IServerConfig } from '../../server/server.config';
import { Logger } from '../../../core/logger';
import { AccountValidationService } from './account.validation.service';

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
		return this.accountDb.findById(id);
	}

	async findMultipleByUserId(userIds: string[]): Promise<AccountDto[]> {
		return this.accountDb.findMultipleByUserId(userIds);
	}

	async findByUserId(userId: string): Promise<AccountDto | null> {
		return this.accountDb.findByUserId(userId);
	}

	async findByUserIdOrFail(userId: string): Promise<AccountDto> {
		return this.accountDb.findByUserIdOrFail(userId);
	}

	async findByUsernameAndSystemId(username: string, systemId: string | ObjectId): Promise<AccountDto | null> {
		return this.accountDb.findByUsernameAndSystemId(username, systemId);
	}

	async searchByUsernamePartialMatch(
		userName: string,
		skip: number,
		limit: number
	): Promise<{ accounts: AccountDto[]; total: number }> {
		return this.accountDb.searchByUsernamePartialMatch(userName, skip, limit);
	}

	async searchByUsernameExactMatch(userName: string): Promise<{ accounts: AccountDto[]; total: number }> {
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
		return ret;
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

	/**
	 * @deprecated For migration purpose only
	 */
	async findMany(offset = 0, limit = 100): Promise<AccountDto[]> {
		return this.accountDb.findMany(offset, limit);
	}

	private async executeIdmMethod<T>(idmCallback: () => Promise<T>) {
		if (this.configService.get('FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED')) {
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
