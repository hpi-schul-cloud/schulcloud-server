import { AccountEntity } from '@shared/domain';
import { AccountDto } from '@modules/account/services/dto/account.dto';
import { AccountResponse } from '../../controller/dto';

export class AccountResponseMapper {
	static mapToResponseFromEntity(account: AccountEntity): AccountResponse {
		return new AccountResponse({
			id: account.id,
			userId: account.userId?.toString(),
			activated: account.activated,
			username: account.username,
			updatedAt: account.updatedAt,
		});
	}

	static mapToResponse(account: AccountDto): AccountResponse {
		return new AccountResponse({
			id: account.id,
			userId: account.userId,
			activated: account.activated,
			username: account.username,
			updatedAt: account.updatedAt,
		});
	}
}
