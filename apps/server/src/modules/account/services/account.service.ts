import { Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import { Account, EntityId } from '@shared/domain';
import { AccountRepo } from '@shared/repo';
import { AccountEntityToDtoMapper } from '../mapper/account-entity-to-dto.mapper';
import { AccountDto } from './dto/account.dto';

@Injectable()
export class AccountService {
	constructor(private accountRepo: AccountRepo) {}

	async findById(id: EntityId): Promise<AccountDto> {
		const accountEntity = await this.accountRepo.findById(id);
		return AccountEntityToDtoMapper.mapToDto(accountEntity);
	}

	async findByUserId(userId: EntityId): Promise<AccountDto | null> {
		const accountEntity = await this.accountRepo.findByUserId(userId);
		return accountEntity ? AccountEntityToDtoMapper.mapToDto(accountEntity) : null;
	}

	async findByUserIdOrFail(userId: EntityId): Promise<AccountDto> {
		const accountEntity = await this.accountRepo.findByUserId(userId);
		if (!accountEntity) {
			throw new EntityNotFoundError('Account');
		}
		return AccountEntityToDtoMapper.mapToDto(accountEntity);
	}

	async save(accountDto: AccountDto): Promise<void> {
		let account: Account;
		if (accountDto.id) {
			account = await this.accountRepo.findById(accountDto.id);
			account.userId = accountDto.userId;
			account.systemId = accountDto.systemId;
			account.username = accountDto.username;
			account.activated = accountDto.activated;
			account.expiresAt = accountDto.expiresAt;
			account.lasttriedFailedLogin = accountDto.lasttriedFailedLogin;
			account.password = accountDto.password;
			account.credentialHash = accountDto.credentialHash;
			account.token = accountDto.token;
		} else {
			account = new Account({
				userId: accountDto.userId,
				systemId: accountDto.systemId,
				username: accountDto.username,
				activated: accountDto.activated,
				expiresAt: accountDto.expiresAt,
				lasttriedFailedLogin: accountDto.lasttriedFailedLogin,
				password: accountDto.password,
				token: accountDto.token,
				credentialHash: accountDto.credentialHash,
			});
		}
		await this.accountRepo.save(account);
		return Promise.resolve();
	}

	async delete(account: AccountDto): Promise<void> {
		return this.accountRepo.deleteById(account.id);
	}

	async searchByUsernamePartialMatch(
		userName: string,
		skip: number,
		limit: number
	): Promise<{ accounts: AccountDto[]; total: number }> {
		const accountEntities = await this.accountRepo.searchByUsernamePartialMatch(userName, skip, limit);
		return this.mapSearchResult(accountEntities);
	}

	async searchByUsernameExactMatch(userName: string): Promise<{ accounts: AccountDto[]; total: number }> {
		const accountEntities = await this.accountRepo.searchByUsernameExactMatch(userName);
		return this.mapSearchResult(accountEntities);
	}

	private mapSearchResult(accountEntities: [Account[], number]) {
		const accountDtos: AccountDto[] = [];
		accountEntities[0].forEach((accountEntity) => {
			accountDtos.push(AccountEntityToDtoMapper.mapToDto(accountEntity));
		});
		return { accounts: accountDtos, total: accountEntities[1] };
	}
}
