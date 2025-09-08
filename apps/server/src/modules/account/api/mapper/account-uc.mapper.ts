import { Counted } from '@shared/domain/types';
import { Account } from '../../domain';
import { ResolvedAccountDto } from '../dto/resolved-account.dto';

export class AccountUcMapper {
	public static mapToResolvedAccountDto(account: Account): ResolvedAccountDto {
		return new ResolvedAccountDto({
			...account.getProps(),
		});
	}

	public static mapSearchResult(accounts: Counted<Account[]>): Counted<ResolvedAccountDto[]> {
		const foundAccounts = accounts[0];
		const accountDos: ResolvedAccountDto[] = AccountUcMapper.mapAccountsToDo(foundAccounts);
		return [accountDos, accounts[1]];
	}

	public static mapAccountsToDo(accounts: Account[]): ResolvedAccountDto[] {
		return accounts.map((account) => AccountUcMapper.mapToResolvedAccountDto(account));
	}
}
