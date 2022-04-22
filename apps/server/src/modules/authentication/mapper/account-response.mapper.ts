import { Account } from '@shared/domain';
import { AccountResponse } from '../controller/dto';

export class AccountResponseMapper {
	static mapToResponse(account: Account): AccountResponse {
		return new AccountResponse({
			id: account.id,
			userId: account.user.id,
			activated: account.activated ?? false,
			username: account.username,
		});
	}
}
