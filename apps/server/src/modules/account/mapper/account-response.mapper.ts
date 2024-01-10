import { Account } from '@src/modules/account/domain/account';
import { AccountEntity } from '@shared/domain/entity';
import { AccountResponse } from '../controller/dto';

export class AccountResponseMapper {
	// TODO: remove this one
	static mapToResponseFromEntity(account: AccountEntity): AccountResponse {
		return new AccountResponse({
			id: account.id,
			userId: account.userId?.toString(),
			activated: account.activated,
			username: account.username,
			updatedAt: account.updatedAt,
		});
	}

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
