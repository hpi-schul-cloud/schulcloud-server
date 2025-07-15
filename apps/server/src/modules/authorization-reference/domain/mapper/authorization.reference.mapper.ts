import { JwtPayload } from '@infra/auth-guard';
import { EntityId } from '@shared/domain/types';
import { CreateAccessTokenParams } from '../../api/dto';
import { AuthorizationContext, TokenMetadata } from '../vo';

export class TokenMetadataMapper {
	public static mapFromParamsToTokenMetadata(
		params: CreateAccessTokenParams,
		userId: EntityId,
		jwtPayload: JwtPayload
	): TokenMetadata {
		const context = new AuthorizationContext(params.context);

		const tokenMetadata = new TokenMetadata({
			userId,
			accountId: jwtPayload.accountId,
			jwtJti: jwtPayload.jti,
			authorizationContext: context,
			customPayload: params.payload,
			referenceType: params.referenceType,
			referenceId: params.referenceId,
		});

		return tokenMetadata;
	}

	public static mapFromServiceResponseToTokenMetadata(tokenMetadataProps: TokenMetadata): TokenMetadata {
		const context = new AuthorizationContext(tokenMetadataProps.authorizationContext);

		const tokenMetadata = new TokenMetadata({
			...tokenMetadataProps,
			authorizationContext: context,
		});

		return tokenMetadata;
	}
}
