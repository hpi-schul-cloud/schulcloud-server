import { Account } from '@shared/domain';
import { AccountReadDto } from '../services/dto/account.dto';

export class AccountEntityToDtoMapper {
	static mapToDto(account: Account): AccountReadDto {
		return new AccountReadDto({
			id: account.id,
			createdAt: account.createdAt,
			updatedAt: account.updatedAt,
			userId: account.userId?.toString(),
			username: account.username,
			activated: account.activated,
			credentialHash: account.credentialHash,
			expiresAt: account.expiresAt,
			lasttriedFailedLogin: account.lasttriedFailedLogin,
			oldHashedPassword: account.password,
			systemId: account.systemId?.toString(),
			token: account.token,
		});
	}

	static mapSearchResult(accountEntities: [Account[], number]): { accounts: AccountReadDto[]; total: number } {
		const foundAccounts = accountEntities[0];
		const accountDtos: AccountReadDto[] = AccountEntityToDtoMapper.mapAccountsToDto(foundAccounts);
		return { accounts: accountDtos, total: accountEntities[1] };
	}

	static mapAccountsToDto(accounts: Account[]): AccountReadDto[] {
		return accounts.map((accountEntity) => AccountEntityToDtoMapper.mapToDto(accountEntity));
	}
}
