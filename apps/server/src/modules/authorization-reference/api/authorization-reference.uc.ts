import { AccessTokenService } from '@infra/access-token';
import { AuthorizableReferenceType, AuthorizationContext } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { AuthorizationReferenceMapper, AuthorizationReferenceService, TokenPayload } from '../domain';
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
		private readonly accessTokenService: AccessTokenService
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

		const authorizationResponse = AuthorizationResponseMapper.mapToResponse(userId, hasPermission);

		return authorizationResponse;
	}

	public async createToken(userId: EntityId, params: CreateAccessTokenParams): Promise<AccessTokenResponse> {
		const authorizationReference = AuthorizationReferenceMapper.mapToReferenceVo(
			params.context,
			params.referenceType,
			params.referenceId,
			userId,
			params.payload
		);

		await this.checkPermissionsForReference(authorizationReference);

		const { token } = await this.accessTokenService.createToken(authorizationReference);

		const accessTokenResponse = AuthorizationResponseMapper.mapToAccessTokenResponse(token);

		return accessTokenResponse;
	}

	public async resolveToken(accessToken: AccessTokenParams): Promise<AccessTokenPayloadResponse> {
		const result = await this.accessTokenService.resolveToken<TokenPayload>(accessToken);

		const authorizationReference = AuthorizationReferenceMapper.mapToReferenceVo(
			result.authorizationContext,
			result.referenceType,
			result.referenceId,
			result.userId,
			result.customPayload
		);

		await this.checkPermissionsForReference(authorizationReference);

		const payloadResponse = AuthorizationResponseMapper.mapToAccessTokenPayload(authorizationReference.customPayload);

		return payloadResponse;
	}

	private async checkPermissionsForReference(authorizationReference: TokenPayload): Promise<void> {
		await this.authorizationReferenceService.checkPermissionByReferences(
			authorizationReference.userId,
			authorizationReference.referenceType,
			authorizationReference.referenceId,
			authorizationReference.authorizationContext
		);
	}
}
