import { AccessTokenService } from '@infra/access-token';
import { JwtPayloadVoFactory, JwtValidationAdapter } from '@infra/auth-guard';
import { AuthorizableReferenceType, AuthorizationContext } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { AuthorizationReferenceService, TokenMetadata, TokenMetadataMapper } from '../domain';
import {
	AccessTokenParams,
	AccessTokenPayloadResponse,
	AccessTokenResponse,
	AuthorizedResponse,
	CreateAccessTokenParams,
} from './dto';
import { AuthorizationResponseMapper } from './mapper';

@Injectable()
export class AuthorizationReferenceUc {
	constructor(
		private readonly authorizationReferenceService: AuthorizationReferenceService,
		private readonly accessTokenService: AccessTokenService,
		private readonly jwtValidationAdapter: JwtValidationAdapter
	) {}

	public async authorizeByReference(
		userId: EntityId,
		authorizableReferenceType: AuthorizableReferenceType,
		authorizableReferenceId: EntityId,
		context: AuthorizationContext
	): Promise<AuthorizedResponse> {
		const hasPermission = await this.authorizationReferenceService.hasPermissionByReferences(
			userId,
			authorizableReferenceType,
			authorizableReferenceId,
			context
		);

		const authorizationResponse = AuthorizationResponseMapper.mapToAuthorizedResponse(userId, hasPermission);

		return authorizationResponse;
	}

	public async createToken(
		userId: EntityId,
		params: CreateAccessTokenParams,
		jwtToken: string
	): Promise<AccessTokenResponse> {
		const jwtPayload = JwtPayloadVoFactory.build(jwtToken);
		const authorizationReference = TokenMetadataMapper.mapToTokenMetadata({ ...params, ...jwtPayload, userId });

		await this.checkPermissionsForReference(authorizationReference);

		const { token } = await this.accessTokenService.createToken(authorizationReference, params.tokenTtl);
		const accessTokenResponse = AuthorizationResponseMapper.mapToAccessTokenResponse(token);

		return accessTokenResponse;
	}

	public async resolveToken(accessToken: AccessTokenParams): Promise<AccessTokenPayloadResponse> {
		const result = await this.accessTokenService.resolveToken(accessToken);
		const tokenMetadata = TokenMetadataMapper.mapToTokenMetadata(result);

		await this.jwtValidationAdapter.isWhitelisted(tokenMetadata.accountId, tokenMetadata.jti);
		await this.checkPermissionsForReference(tokenMetadata);

		const payloadResponse = AuthorizationResponseMapper.mapToAccessTokenPayload(tokenMetadata.customPayload);

		return payloadResponse;
	}

	private async checkPermissionsForReference(authorizationReference: TokenMetadata): Promise<void> {
		await this.authorizationReferenceService.checkPermissionByReferences(
			authorizationReference.userId,
			authorizationReference.referenceType,
			authorizationReference.referenceId,
			authorizationReference.authorizationContext
		);
	}
}
