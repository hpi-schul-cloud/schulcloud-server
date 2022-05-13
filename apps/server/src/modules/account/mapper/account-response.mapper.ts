import { Account } from '@shared/domain';
import { AccountDto } from '@src/modules/account/services/dto/account.dto';
import { AccountResponse } from '../controller/dto';

export class AccountResponseMapper {
	static mapToResponseFromEntity(account: Account): AccountResponse {
		return new AccountResponse({
			id: account.id,
			userId: account.userId.toString(),
			activated: account.activated ?? false,
			username: account.username,
		});
	}

	static mapToResponse(account: AccountDto): AccountResponse {
		return new AccountResponse({
			id: account.id,
			userId: account.userId.toString(),
			activated: account.activated ?? false,
			username: account.username,
		});
	}
}
