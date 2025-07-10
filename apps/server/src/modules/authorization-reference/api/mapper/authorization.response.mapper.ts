import { EntityId } from '@shared/domain/types';
import { AccessTokenPayloadResponse, AccessTokenResponse, AuthorizedResponse } from '../dto/authorization.reponse';

export class AuthorizationResponseMapper {
	public static mapToResponse(userId: EntityId, isAuthorized: boolean): AuthorizedResponse {
		const authorizationResponse = new AuthorizedResponse({
			userId,
			isAuthorized,
		});

		return authorizationResponse;
	}

	public static mapToAccessTokenResponse(token: string): AccessTokenResponse {
		const accessTokenResponse = new AccessTokenResponse(token);

		return accessTokenResponse;
	}

	public static mapToAccessTokenPayload(payload: Record<string, unknown>): AccessTokenPayloadResponse {
		const accessTokenPayloadResponse = new AccessTokenPayloadResponse(payload);

		return accessTokenPayloadResponse;
	}
}
