import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable, NotImplementedException } from '@nestjs/common';

import { EntityId } from '@shared/domain';
import { IdentityManagementService } from '@shared/infra/identity-management/identity-management.service';
import { AccountIdmToDtoMapper } from '../mapper/account-idm-to-dto.mapper';
import { AbstractAccountService } from './account.service.abstract';
import { AccountDto, AccountSaveDto } from './dto';

@Injectable()
export class AccountServiceIdm extends AbstractAccountService {
	constructor(private readonly identityManager: IdentityManagementService) {
		super();
	}

	// eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
	async findById(id: EntityId): Promise<AccountDto> {
		throw new NotImplementedException();
	}

	// eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
	async findMultipleByUserId(userIds: EntityId[]): Promise<AccountDto[]> {
		throw new NotImplementedException();
	}

	// eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
	async findByUserId(userId: EntityId): Promise<AccountDto | null> {
		throw new NotImplementedException();
	}

	// eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
	async findByUserIdOrFail(userId: EntityId): Promise<AccountDto> {
		throw new NotImplementedException();
	}

	// eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
	async findByUsernameAndSystemId(username: string, systemId: EntityId | ObjectId): Promise<AccountDto | null> {
		throw new NotImplementedException();
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async searchByUsernamePartialMatch(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		userName: string,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		skip: number,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		limit: number
	): Promise<{ accounts: AccountDto[]; total: number }> {
		throw new NotImplementedException();
	}

	// eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
	async searchByUsernameExactMatch(userName: string): Promise<{ accounts: AccountDto[]; total: number }> {
		throw new NotImplementedException();
	}

	// eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
	async updateLastTriedFailedLogin(accountId: EntityId, lastTriedFailedLogin: Date): Promise<AccountDto> {
		throw new NotImplementedException();
	}

	async save(accountDto: AccountSaveDto): Promise<AccountDto> {
		let accountId: string;
		if (accountDto.id && accountDto.refId) {
			accountId = await this.identityManager.updateAccount(accountDto.refId, {
				username: accountDto.username,
				attRefTechnicalId: accountDto.id,
				attRefFunctionalIntId: accountDto.userId,
				attRefFunctionalExtId: accountDto.systemId,
			});
		} else {
			if (accountDto.password) {
				accountDto.password = await super.encryptPassword(accountDto.password);
			}
			accountId = await this.identityManager.createAccount(
				{
					username: accountDto.username,
					attRefTechnicalId: accountDto.id,
					attRefFunctionalIntId: accountDto.userId,
					attRefFunctionalExtId: accountDto.systemId,
				},
				accountDto.password
			);
		}

		const updatedAccount = await this.identityManager.findAccountById(accountId);
		return AccountIdmToDtoMapper.mapToDto(updatedAccount);
	}

	async updateUsername(accountRefId: EntityId, username: string): Promise<AccountDto> {
		const id = await this.getInternalId(accountRefId);
		await this.identityManager.updateAccount(id, { username });
		const updatedAccount = await this.identityManager.findAccountById(id);
		return AccountIdmToDtoMapper.mapToDto(updatedAccount);
	}

	async updatePassword(accountRefId: EntityId, password: string): Promise<AccountDto> {
		const id = await this.getInternalId(accountRefId);
		await this.identityManager.updateAccountPassword(id, password);
		const updatedAccount = await this.identityManager.findAccountById(id);
		return AccountIdmToDtoMapper.mapToDto(updatedAccount);
	}

	async delete(accountRefId: EntityId): Promise<void> {
		const id = await this.getInternalId(accountRefId);
		await this.identityManager.deleteAccountById(id);
	}

	async deleteByUserId(userId: EntityId): Promise<void> {
		const idmAccount = await this.identityManager.findAccountByFctIntId(userId);
		return this.delete(idmAccount.id);
	}

	private async getInternalId(accountRefId: string) {
		const idmAccount = await this.identityManager.findAccountByTecRefId(accountRefId);
		return idmAccount.id;
	}
}
