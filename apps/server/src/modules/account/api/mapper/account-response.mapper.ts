import { AccountResponse, AccountSearchListResponse } from '../dto';
import { ResolvedAccountDto, ResolvedSearchListAccountDto } from '../dto/resolved-account.dto';

export class AccountResponseMapper {
	public static mapToAccountResponse(resolvedAccount: ResolvedAccountDto): AccountResponse {
		return new AccountResponse({
			id: resolvedAccount.id,
			userId: resolvedAccount.userId,
			activated: resolvedAccount.activated,
			username: resolvedAccount.username,
			updatedAt: resolvedAccount.updatedAt,
		});
	}

	public static mapToAccountResponses(resolvedAccounts: ResolvedAccountDto[]): AccountResponse[] {
		return resolvedAccounts.map((resolvedAccount) => AccountResponseMapper.mapToAccountResponse(resolvedAccount));
	}

	public static mapToAccountSearchListResponse(
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
