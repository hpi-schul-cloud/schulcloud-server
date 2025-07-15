import { JwtPayload } from '@infra/auth-guard';
import { CreateAccessTokenParams } from '@modules/authorization-reference/api/dto';
import { TypeGuard } from '@shared/common/guards';
import { EntityId } from '@shared/domain/types';
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

	public static mapFromServiceResponseToTokenMetadata(props: unknown): TokenMetadata {
		const definedObject = TypeGuard.checkDefinedObject(props);
		const authorizationContext = TypeGuard.checkKeyInObject(definedObject, 'authorizationContext');

		const context = new AuthorizationContext(authorizationContext);

		const referenceVo = new TokenMetadata({
			...definedObject,
			authorizationContext: context,
		});

		return referenceVo;
	}
}
