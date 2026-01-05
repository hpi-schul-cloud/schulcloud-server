import { AuthorizableReferenceType } from '@modules/authorization/domain';
import { EntityId } from '@shared/domain/types';
import {
	AccessTokenPayloadResponse,
	AccessTokenResponse,
	AuthorizedByReferenceResponse,
	AuthorizedResponse,
} from '../dto/authorization.reponse';

export class AuthorizationResponseMapper {
	public static mapToAuthorizedResponse(userId: EntityId, isAuthorized: boolean): AuthorizedResponse {
		const authorizationResponse = new AuthorizedResponse({
			userId,
			isAuthorized,
		});

		return authorizationResponse;
	}

	public static mapToAuthorizedByReferenceResponse(
		userId: EntityId,
		isAuthorized: boolean,
		referenceType: AuthorizableReferenceType,
		referenceId: EntityId
	): AuthorizedByReferenceResponse {
		const authorizedByReferenceResponse = new AuthorizedByReferenceResponse({
			userId,
			isAuthorized,
			referenceType,
			referenceId,
		});

		return authorizedByReferenceResponse;
	}

	public static mapToAccessTokenResponse(token: string): AccessTokenResponse {
		const accessTokenResponse = new AccessTokenResponse(token);

		return accessTokenResponse;
	}

	public static mapToAccessTokenPayload(
		payload: Record<string, unknown>,
		tokenTtlInSeconds: number
	): AccessTokenPayloadResponse {
		const accessTokenPayloadResponse = new AccessTokenPayloadResponse(payload, tokenTtlInSeconds);

		return accessTokenPayloadResponse;
	}
}
