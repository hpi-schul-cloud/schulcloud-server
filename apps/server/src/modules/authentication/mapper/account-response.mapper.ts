import { Account } from '@shared/domain';
import { AccountResponse } from '../controller/dto';
import { AccountDto } from '../services/dto/account.dto';

export class AccountResponseMapper {
	static mapToResponseFromEntity(account: Account): AccountResponse {
		return new AccountResponse({
			id: account.id,
			userId: account.user.id,
			activated: account.activated ?? false,
			username: account.username,
		});
	}

	static mapToResponse(account: AccountDto): AccountResponse {
		return new AccountResponse({
			id: account.id,
			userId: account.userId,
			activated: account.activated ?? false,
			username: account.username,
		});
	}
}
