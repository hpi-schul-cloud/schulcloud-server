import { JwtPayload } from '@infra/auth-guard';
import { AuthorizationContext } from '@modules/authorization';
import { EntityId } from '@shared/domain/types';
import { CreateAccessTokenParams } from '../../api/dto';
import { TokenMetadata } from '../vo';

export class TokenMetadataFactory {
	public static build(tokenMetadataProps: TokenMetadata): TokenMetadata {
		const context = new AuthorizationContext(tokenMetadataProps.authorizationContext);

		const tokenMetadata = new TokenMetadata({
			...tokenMetadataProps,
			authorizationContext: context,
		});

		return tokenMetadata;
	}

	public static buildFromCreateAccessTokenParams(
		params: CreateAccessTokenParams,
		userId: EntityId,
		jwtPayload: JwtPayload
	): TokenMetadata {
		const tokenMetadata = this.build({
			userId,
			accountId: jwtPayload.accountId,
			jwtJti: jwtPayload.jti,
			authorizationContext: params.context,
			customPayload: params.payload,
			referenceType: params.referenceType,
			referenceId: params.referenceId,
		});

		return tokenMetadata;
	}
}
