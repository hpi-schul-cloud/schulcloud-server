import { AccessTokenService } from '@infra/access-token';
import { ICurrentUser, JwtPayload, JwtValidationAdapter } from '@infra/auth-guard';
import { AuthorizableReferenceType, AuthorizationContext } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import jwt from 'jsonwebtoken';
import { AuthorizationReferenceService } from '../domain';
import {
	AccessTokenParams,
	AccessTokenPayloadResponse,
	AccessTokenResponse,
	AuthorizedResponse,
	CreateAccessTokenParams,
} from './dto';
import { AuthorizationResponseMapper } from './mapper';
import { TokenMetadataFactory } from './factory';
import { TokenMetadata } from './vo';

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
		currentUser: ICurrentUser,
		params: CreateAccessTokenParams,
		jwtToken: string
	): Promise<AccessTokenResponse> {
		// Just casting of JWT because validation already happened in the request pipeline
		const decodedJwt = this.decodeJwt(jwtToken);
		const tokenMetadata = TokenMetadataFactory.buildFromCreateAccessTokenParams(params, currentUser, decodedJwt.jti);

		await this.checkPermissionsForReference(tokenMetadata);

		const { token } = await this.accessTokenService.createToken(tokenMetadata, params.tokenTtlInSeconds);
		const accessTokenResponse = AuthorizationResponseMapper.mapToAccessTokenResponse(token);

		return accessTokenResponse;
	}

	private decodeJwt(jwtToken: string): JwtPayload {
		const decodedJwt = jwt.decode(jwtToken, { json: true }) as JwtPayload;

		return decodedJwt;
	}

	private getFactoryCallback(accessToken: AccessTokenParams): (tokenMetadata: TokenMetadata) => TokenMetadata {
		return (tokenMetadata: TokenMetadata): TokenMetadata =>
			TokenMetadataFactory.buildFromAccessTokenParams(tokenMetadata, accessToken.tokenTtlInSeconds);
	}

	public async resolveToken(accessToken: AccessTokenParams): Promise<AccessTokenPayloadResponse> {
		const tokenMetadata = await this.accessTokenService.resolveToken<TokenMetadata>(
			accessToken,
			this.getFactoryCallback(accessToken)
		);

		await this.jwtValidationAdapter.isWhitelisted(tokenMetadata.accountId, tokenMetadata.jwtJti);
		await this.checkPermissionsForReference(tokenMetadata);

		const payloadResponse = AuthorizationResponseMapper.mapToAccessTokenPayload(
			tokenMetadata.customPayload,
			tokenMetadata.tokenTtlInSeconds
		);

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
