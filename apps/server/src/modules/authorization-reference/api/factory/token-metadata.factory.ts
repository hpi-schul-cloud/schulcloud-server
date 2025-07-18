import { AuthorizationContext } from '@modules/authorization';
import { CreateAccessTokenParams } from '../../api/dto';
import { TokenMetadata } from '../vo';
import { ICurrentUser } from '@infra/auth-guard';

export class TokenMetadataFactory {
	public static build(tokenMetadataProps: TokenMetadata): TokenMetadata {
		const context = new AuthorizationContext(tokenMetadataProps.authorizationContext);

		const tokenMetadata = new TokenMetadata({
			...tokenMetadataProps,
			authorizationContext: context,
		});

		return tokenMetadata;
	}

	public static buildFromAccessTokenParams(tokenMetadata: TokenMetadata, tokenTtlInSeconds: number): TokenMetadata {
		return TokenMetadataFactory.build({
			...tokenMetadata,
			tokenTtlInSeconds,
		});
	}

	public static buildFromCreateAccessTokenParams(
		params: CreateAccessTokenParams,
		currentUser: ICurrentUser,
		jwtJti: string
	): TokenMetadata {
		const tokenMetadata = TokenMetadataFactory.build({
			userId: currentUser.userId,
			accountId: currentUser.accountId,
			jwtJti,
			authorizationContext: params.context,
			customPayload: params.payload,
			referenceType: params.referenceType,
			referenceId: params.referenceId,
			tokenTtlInSeconds: params.tokenTtlInSeconds,
		});

		return tokenMetadata;
	}
}
