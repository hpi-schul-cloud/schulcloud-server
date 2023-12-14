import { AccountResponse } from '../dto';
import { ResolvedAccountDto } from '../../uc/dto';
import { AccountEntity } from '../../entity';

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

	static mapToAccountResponse(resolvedAccount: ResolvedAccountDto): AccountResponse {
		return new AccountResponse({
			id: resolvedAccount.id,
			userId: resolvedAccount.userId,
			activated: resolvedAccount.activated,
			username: resolvedAccount.username,
			updatedAt: resolvedAccount.updatedAt,
		});
	}
}
