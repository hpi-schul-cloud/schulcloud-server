import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Counted, EntityId, IAccountUpdate } from '@shared/domain';
import { IdentityManagementService } from '@shared/infra/identity-management/identity-management.service';
import { AccountIdmToDtoMapper } from '../mapper/account-idm-to-dto.mapper';
import { AbstractAccountService } from './account.service.abstract';
import { AccountDto, AccountSaveDto } from './dto';

@Injectable()
export class AccountServiceIdm extends AbstractAccountService {
	constructor(
		private readonly identityManager: IdentityManagementService,
		private readonly configService: ConfigService
	) {
		super();
	}

	async findById(id: EntityId): Promise<AccountDto> {
		const result = await this.identityManager.findAccountById(id);
		const account = AccountIdmToDtoMapper.mapToDto(result);
		return account;
	}

	async findMultipleByUserId(userIds: EntityId[]): Promise<AccountDto[]> {
		const results = (await this.identityManager.getAllAccounts()).filter((account) => userIds.includes(account.id));
		const accounts = results.map((result) => AccountIdmToDtoMapper.mapToDto(result));
		return accounts;
	}

	async findByUserId(userId: EntityId): Promise<AccountDto | null> {
		const result = await this.identityManager.findAccountByFctIntId(userId);
		const account = result ? AccountIdmToDtoMapper.mapToDto(result) : null;
		return account;
	}

	async findByUserIdOrFail(userId: EntityId): Promise<AccountDto> {
		const result = await this.identityManager.findAccountByFctIntId(userId);
		if (!result) {
			throw new NotFoundException(`Account with userId ${userId} not found`);
		}
		const account = AccountIdmToDtoMapper.mapToDto(result);
		return account;
	}

	async findByUsernameAndSystemId(username: string, systemId: EntityId | ObjectId): Promise<AccountDto | null> {
		const [accounts] = await this.searchByUsernameExactMatch(username);
		const account = accounts.find((tempAccount) => tempAccount.systemId === systemId) || null;
		return account;
	}

	async searchByUsernamePartialMatch(userName: string, skip: number, limit: number): Promise<Counted<AccountDto[]>> {
		const results = await this.identityManager.findAccountsByUsername(userName, { exact: false });
		const accounts = results.slice(skip, skip + limit).map((result) => AccountIdmToDtoMapper.mapToDto(result));
		return [accounts, results.length];
	}

	async searchByUsernameExactMatch(userName: string): Promise<Counted<AccountDto[]>> {
		const results = await this.identityManager.findAccountsByUsername(userName, { exact: true });
		const accounts = results.map((result) => AccountIdmToDtoMapper.mapToDto(result));
		return [accounts, accounts.length];
	}

	async updateLastTriedFailedLogin(accountId: EntityId, lastTriedFailedLogin: Date): Promise<AccountDto> {
		const attributeName = 'lastTriedFailedLogin';
		const id = await this.getIdmAccountId(accountId);
		await this.identityManager.setUserAttribute(id, attributeName, lastTriedFailedLogin.toISOString());
		const updatedAccount = await this.identityManager.findAccountById(id);
		return AccountIdmToDtoMapper.mapToDto(updatedAccount);
	}

	async save(accountDto: AccountSaveDto): Promise<AccountDto> {
		let accountId: string;
		const idmAccount: IAccountUpdate = {
			username: accountDto.username,
			attRefTechnicalId: accountDto.idmReferenceId,
			attRefFunctionalIntId: accountDto.userId,
			attRefFunctionalExtId: accountDto.systemId,
		};
		if (accountDto.id) {
			const id = await this.getIdmAccountId(accountDto.id);
			accountId = await this.identityManager.updateAccount(id, idmAccount);
			if (accountDto.password) {
				await this.identityManager.updateAccountPassword(id, accountDto.password);
			}
		} else {
			accountId = await this.identityManager.createAccount(idmAccount, accountDto.password);
		}

		const updatedAccount = await this.identityManager.findAccountById(accountId);
		return AccountIdmToDtoMapper.mapToDto(updatedAccount);
	}

	async updateUsername(accountRefId: EntityId, username: string): Promise<AccountDto> {
		const id = await this.getIdmAccountId(accountRefId);
		await this.identityManager.updateAccount(id, { username });
		const updatedAccount = await this.identityManager.findAccountById(id);
		return AccountIdmToDtoMapper.mapToDto(updatedAccount);
	}

	async updatePassword(accountRefId: EntityId, password: string): Promise<AccountDto> {
		const id = await this.getIdmAccountId(accountRefId);
		await this.identityManager.updateAccountPassword(id, password);
		const updatedAccount = await this.identityManager.findAccountById(id);
		return AccountIdmToDtoMapper.mapToDto(updatedAccount);
	}

	async delete(accountRefId: EntityId): Promise<void> {
		const id = await this.getIdmAccountId(accountRefId);
		await this.identityManager.deleteAccountById(id);
	}

	async deleteByUserId(userId: EntityId): Promise<void> {
		const idmAccount = await this.identityManager.findAccountByFctIntId(userId);
		await this.identityManager.deleteAccountById(idmAccount.id);
	}

	private async getIdmAccountId(accountId: string) {
		if (this.configService.get('FEATURE_IDENTITY_MANAGEMENT_IS_PRIMARY') === true) {
			return accountId;
		}
		const idmAccount = await this.identityManager.findAccountByTecRefId(accountId);
		return idmAccount.id;
	}
}
