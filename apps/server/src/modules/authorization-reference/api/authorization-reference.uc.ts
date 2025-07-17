import { AccessTokenService } from '@infra/access-token';
import { JwtPayloadVoFactory, JwtValidationAdapter } from '@infra/auth-guard';
import { AuthorizableReferenceType, AuthorizationContext } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { AuthorizationReferenceService, TokenMetadata, TokenMetadataFactory } from '../domain';
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
		const tokenMetadata = TokenMetadataFactory.buildFromCreateAccessTokenParams(params, userId, jwtPayload);

		await this.checkPermissionsForReference(tokenMetadata);

		const { token } = await this.accessTokenService.createToken(tokenMetadata, params.tokenTtlInSeconds);
		const accessTokenResponse = AuthorizationResponseMapper.mapToAccessTokenResponse(token);

		return accessTokenResponse;
	}

	public async resolveToken(accessToken: AccessTokenParams): Promise<AccessTokenPayloadResponse> {
		const factoryCallback = (tokenMetadata: TokenMetadata): TokenMetadata => TokenMetadataFactory.build(tokenMetadata);
		const tokenMetadata = await this.accessTokenService.resolveToken<TokenMetadata>(accessToken, factoryCallback);

		await this.jwtValidationAdapter.isWhitelisted(tokenMetadata.accountId, tokenMetadata.jwtJti);
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
