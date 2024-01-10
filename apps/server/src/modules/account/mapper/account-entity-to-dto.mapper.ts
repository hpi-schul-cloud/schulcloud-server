import { AccountEntity } from '@shared/domain/entity';
import { Counted } from '@shared/domain/types';
import { AccountDto } from '../services/dto/account.dto';

export class AccountEntityToDtoMapper {
	static mapToDto(account: AccountEntity): AccountDto {
		return new AccountDto({
			id: account.id,
			createdAt: account.createdAt,
			updatedAt: account.updatedAt,
			userId: account.userId?.toString(),
			username: account.username,
			activated: account.activated,
			credentialHash: account.credentialHash,
			expiresAt: account.expiresAt,
			lasttriedFailedLogin: account.lasttriedFailedLogin,
			password: account.password,
			systemId: account.systemId?.toString(),
			token: account.token,
		});
	}

	static mapSearchResult(accountEntities: Counted<AccountEntity[]>): Counted<AccountDto[]> {
		const foundAccounts = accountEntities[0];
		const accountDtos: AccountDto[] = AccountEntityToDtoMapper.mapAccountsToDto(foundAccounts);
		return [accountDtos, accountEntities[1]];
	}

	static mapAccountsToDto(accounts: AccountEntity[]): AccountDto[] {
		return accounts.map((accountEntity) => AccountEntityToDtoMapper.mapToDto(accountEntity));
	}
}
