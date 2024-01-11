import { Account } from '@src/modules/account/domain/account';
import { AccountResponse } from '../dto';

export class AccountResponseMapper {
	static mapToResponse(account: Account): AccountResponse {
		return new AccountResponse({
			id: account.id ?? '',
			userId: account.userId,
			activated: account.activated,
			username: account.username,
			updatedAt: account.updatedAt,
		});
	}
}
