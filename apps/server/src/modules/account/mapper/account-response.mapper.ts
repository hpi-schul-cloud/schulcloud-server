import { Account } from '@shared/domain/entity/account.entity';
import { AccountResponse } from '../controller/dto/account.response';
import { AccountDto } from '../services/dto/account.dto';

export class AccountResponseMapper {
	// TODO: remove this one
	static mapToResponseFromEntity(account: Account): AccountResponse {
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
