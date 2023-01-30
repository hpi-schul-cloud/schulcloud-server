import { ObjectId } from '@mikro-orm/mongodb';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { AccountServiceDb } from './account-db.service';
import { AccountServiceIdm } from './account-idm.service';
import { AbstractAccountService } from './account.service.abstract';
import { AccountDto, AccountSaveDto } from './dto';
import { IServerConfig } from '../../server/server.config';
import { Logger } from '../../../core/logger';

@Injectable()
export class AccountService extends AbstractAccountService {
	constructor(
		private readonly accountDb: AccountServiceDb,
		private readonly accountIdm: AccountServiceIdm,
		private readonly configService: ConfigService<IServerConfig, true>,
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
		const sanitizedUsername = this.sanitizeUserName(username);
		return this.accountDb.findByUsernameAndSystemId(sanitizedUsername, systemId);
	}

	async searchByUsernamePartialMatch(
		userName: string,
		skip: number,
		limit: number
	): Promise<{ accounts: AccountDto[]; total: number }> {
		const sanitizedUsername = this.sanitizeUserName(userName);
		return this.accountDb.searchByUsernamePartialMatch(sanitizedUsername, skip, limit);
	}

	async searchByUsernameExactMatch(userName: string): Promise<{ accounts: AccountDto[]; total: number }> {
		const sanitizedUsername = this.sanitizeUserName(userName);
		return this.accountDb.searchByUsernameExactMatch(sanitizedUsername);
	}

	async save(accountDto: AccountSaveDto): Promise<AccountDto> {
		accountDto.username = this.sanitizeUserName(accountDto.username);
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

	async updateUsername(accountId: string, username: string): Promise<AccountDto> {
		username = this.sanitizeUserName(username);
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

	private sanitizeUserName(username: string): string {
		return username.toLowerCase();
	}
}
