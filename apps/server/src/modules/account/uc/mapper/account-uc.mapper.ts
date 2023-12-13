import { Account } from '../../';
import { ResolvedAccountDto } from '../dto';

export class AccountUcMapper {
	// static mapToResponseFromEntity(account: AccountEntity): AccountResponse {
	// 	return new AccountResponse({
	// 		id: account.id,
	// 		userId: account.userId?.toString(),
	// 		activated: account.activated,
	// 		username: account.username,
	// 		updatedAt: account.updatedAt,
	// 	});
	// }

	static mapToResolvedAccountDto(account: Account): ResolvedAccountDto {
		return new ResolvedAccountDto({
			id: account.id,
			userId: account.userId,
			activated: account.activated,
			username: account.username,
			updatedAt: account.updatedAt,
		});
	}
}
