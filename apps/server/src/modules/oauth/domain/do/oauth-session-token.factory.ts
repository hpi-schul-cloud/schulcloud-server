import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain/types';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { TokenInvalidLoggableException } from '../../loggable';
import { OauthSessionToken } from './oauth-session-token';

export class OauthSessionTokenFactory {
	public static build(params: { userId: EntityId; systemId: EntityId; refreshToken: string }): OauthSessionToken {
		const decodedRefreshToken: JwtPayload | null = jwt.decode(params.refreshToken, { json: true });

		if (!decodedRefreshToken?.exp) {
			throw new TokenInvalidLoggableException();
		}

		const oauthSessionToken = new OauthSessionToken({
			...params,
			id: new ObjectId().toHexString(),
			expiresAt: new Date(decodedRefreshToken.exp * 1000),
		});

		return oauthSessionToken;
	}
}
