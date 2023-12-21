import { Account } from '../../domain';
import { ResolvedAccountDto } from '../dto';
import { Counted } from '@shared/domain/types';

export class AccountUcMapper {
	static mapToResolvedAccountDto(account: Account): ResolvedAccountDto {
		return new ResolvedAccountDto({
			...account,
			id: account.id ? account.id : '',
			// userId: account.userId,
			// activated: account.activated,
			username: account.username ? account.username : '',
			// updatedAt: account.updatedAt,
		});
	}

	
	static mapSearchResult(accountEntities: Counted<Account[]>): Counted<ResolvedAccountDto[]> {
		const foundAccounts = accountEntities[0];
		const accountDos: ResolvedAccountDto[] = AccountUcMapper.mapAccountsToDo(foundAccounts);
		return [accountDos, accountEntities[1]];
	}

	static mapAccountsToDo(accounts: Account[]): ResolvedAccountDto[] {
		return accounts.map((account) => AccountUcMapper.mapToResolvedAccountDto(account));
	}

}
