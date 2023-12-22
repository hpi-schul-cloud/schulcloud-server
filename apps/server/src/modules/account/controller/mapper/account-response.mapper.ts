import { AccountResponse, AccountSearchListResponse } from '../dto';
import { ResolvedAccountDto, ResolvedSearchListAccountDto } from '../../uc/dto';
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
			username: resolvedAccount.username ?? '',
			updatedAt: resolvedAccount.updatedAt,
		});
	}

	static mapToAccountResponses(resolvedAccounts: ResolvedAccountDto[]): AccountResponse[] {
		return resolvedAccounts.map((resolvedAccount) => AccountResponseMapper.mapToAccountResponse(resolvedAccount));
	}

	static mapToAccountSearchListResponse(
		resolvedSearchListAccountDto: ResolvedSearchListAccountDto
	): AccountSearchListResponse {
		return new AccountSearchListResponse(
			AccountResponseMapper.mapToAccountResponses(resolvedSearchListAccountDto.data),
			resolvedSearchListAccountDto.total,
			resolvedSearchListAccountDto.skip,
			resolvedSearchListAccountDto.limit
		);
	}
}
