import { Account, IAccount } from '@shared/domain';
import { AccountDto } from '../services/dto/account.dto';

export class AccountIdmToDtoMapper {
	static mapToDto(account: IAccount): AccountDto {
		const currentDate = new Date();
		return new AccountDto({
			id: account.id ?? '',
			createdAt: currentDate,
			updatedAt: currentDate,
			username: account.username ?? '',
		});
	}

	static mapAccountsToDto(accounts: Account[]): AccountDto[] {
		return accounts.map((accountEntity) => AccountIdmToDtoMapper.mapToDto(accountEntity));
	}
}
