import { AccessTokenService } from '@infra/access-token';
import { JwtPayloadVoFactory, JwtValidationAdapter } from '@infra/auth-guard';
import { AuthorizableReferenceType, AuthorizationContext } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import jwt from 'jsonwebtoken';
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
		const result = jwt.decode(jwtToken, { json: true });
		const jwtPayload = JwtPayloadVoFactory.build(result);
		const authorizationReference = TokenMetadataMapper.mapToTokenMetadata({ ...params, ...jwtPayload, userId });

		await this.checkPermissionsForReference(authorizationReference);

		const { token } = await this.accessTokenService.createToken(authorizationReference, params.tokenTtl);
		const accessTokenResponse = AuthorizationResponseMapper.mapToAccessTokenResponse(token);

		return accessTokenResponse;
	}

	public async resolveToken(accessToken: AccessTokenParams): Promise<AccessTokenPayloadResponse> {
		const result = await this.accessTokenService.resolveToken(accessToken);
		const tokenMetadata = TokenMetadataMapper.mapToTokenMetadata(result);
		const jwtPayload = JwtPayloadVoFactory.build(tokenMetadata.customPayload);

		await this.jwtValidationAdapter.isWhitelisted(jwtPayload.accountId, jwtPayload.jti);
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
