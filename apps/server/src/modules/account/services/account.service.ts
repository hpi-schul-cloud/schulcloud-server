import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import bcrypt from 'bcryptjs';
import { Account, EntityId } from '@shared/domain';
import { AccountRepo } from '@shared/repo';
import { AccountEntityToDtoMapper } from '../mapper/account-entity-to-dto.mapper';
import { AccountDto } from './dto/account.dto';
import { AccountSaveDto } from './dto/account.save.dto';

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

	async save(accountDto: AccountSaveDto): Promise<void> {
		// Check if the ID is correct?
		// const user = await this.userRepo.findById(accountDto.userId);
		// const system = accountDto.systemId ? await this.systemRepo.findById(accountDto.systemId) : undefined;
		let account: Account;
		if (accountDto.id) {
			account = await this.accountRepo.findById(accountDto.id);
			account.userId = new ObjectId(accountDto.userId);
			account.systemId = accountDto.systemId ? new ObjectId(accountDto.systemId) : undefined;
			account.username = accountDto.username;
			account.activated = accountDto.activated;
			account.expiresAt = accountDto.expiresAt;
			account.lasttriedFailedLogin = accountDto.lasttriedFailedLogin;
			account.password = accountDto.password ? await this.encryptPassword(accountDto.password) : undefined;
			account.credentialHash = accountDto.credentialHash;
			account.token = accountDto.token;
		} else {
			account = new Account({
				userId: new ObjectId(accountDto.userId),
				systemId: accountDto.systemId ? new ObjectId(accountDto.systemId) : undefined,
				username: accountDto.username,
				activated: accountDto.activated,
				expiresAt: accountDto.expiresAt,
				lasttriedFailedLogin: accountDto.lasttriedFailedLogin,
				password: accountDto.password ? await this.encryptPassword(accountDto.password) : undefined,
				token: accountDto.token,
				credentialHash: accountDto.credentialHash,
			});
		}
		return this.accountRepo.save(account);
	}

	delete(account: AccountDto): Promise<void> {
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
		const foundAccounts = accountEntities[0];
		const accountDtos: AccountDto[] = foundAccounts.map((accountEntity) =>
			AccountEntityToDtoMapper.mapToDto(accountEntity)
		);
		return { accounts: accountDtos, total: accountEntities[1] };
	}

	private encryptPassword(password: string): Promise<string> {
		return bcrypt.hash(password, 10);
	}
}
