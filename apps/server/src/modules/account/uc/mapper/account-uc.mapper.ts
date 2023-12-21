import { Account } from '../../domain';
import { ResolvedAccountDto } from '../dto';

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
}
