import { Account, IAccount } from '@shared/domain';
import { AccountDto } from '../services/dto/account.dto';

export class AccountIdmToDtoMapper {
	static mapToDto(account: IAccount): AccountDto {
		const createdDate = account.createdTimestamp ? new Date(account.createdTimestamp) : new Date();
		return new AccountDto({
			id: account.attRefTechnicalId ?? '',
			refId: account.id ?? '',
			createdAt: createdDate,
			updatedAt: createdDate,
			username: account.username ?? '',
		});
	}

	static mapAccountsToDto(accounts: Account[]): AccountDto[] {
		return accounts.map((accountEntity) => AccountIdmToDtoMapper.mapToDto(accountEntity));
	}
}
