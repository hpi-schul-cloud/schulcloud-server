import { Injectable } from '@nestjs/common';
import { Account, EntityId, User } from '@shared/domain';
import { AccountRepo, SystemRepo, UserRepo } from '@shared/repo';
import { AccountEntityToDtoMapper } from '../mapper/account-entity-to-dto.mapper';
import { AccountDto } from './dto/account.dto';

@Injectable()
export class AccountService {
	constructor(private accountRepo: AccountRepo, private userRepo: UserRepo, private systemRepo: SystemRepo) {}

	async findById(id: EntityId): Promise<AccountDto> {
		const accountEntity = await this.accountRepo.findById(id);
		return AccountEntityToDtoMapper.mapToDto(accountEntity);
	}

	async findByUserId(userId: EntityId): Promise<AccountDto> {
		const accountEntity = await this.accountRepo.findByUserId(userId);
		return AccountEntityToDtoMapper.mapToDto(accountEntity);
	}

	async findOneByUser(user: User): Promise<AccountDto> {
		const accountEntity = await this.accountRepo.findByUserId(user.id);
		return AccountEntityToDtoMapper.mapToDto(accountEntity);
	}

	async save(accountDto: AccountDto): Promise<void> {
		const user = await this.userRepo.findById(accountDto.userId);
		const system = accountDto.systemId ? await this.systemRepo.findById(accountDto.systemId) : undefined;
		const account = new Account({
			user,
			system,
			username: accountDto.username,
			activated: accountDto.activated,
			expiresAt: accountDto.expiresAt,
			lasttriedFailedLogin: accountDto.lasttriedFailedLogin,
			password: accountDto.password,
			token: accountDto.token,
			credentialHash: accountDto.credentialHash,
		});
		await this.accountRepo.save(account);
		return Promise.resolve();
	}

	async delete(account: AccountDto) {
		const accountEntity = await this.accountRepo.findById(account.id);
		return this.accountRepo.delete(accountEntity);
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
