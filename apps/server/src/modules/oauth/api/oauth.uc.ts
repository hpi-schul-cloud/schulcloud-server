import { OauthSessionToken, OauthSessionTokenService } from '@modules/oauth';
import { Injectable } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { EntityId } from '@shared/domain/types';

@Injectable()
export class OAuthUc {
	constructor(private readonly oauthSessionTokenService: OauthSessionTokenService) {}

	public async getLatestSessionTokenByUser(userId: EntityId): Promise<OauthSessionToken> {
		const sessionToken: OauthSessionToken | null = await this.oauthSessionTokenService.findLatestByUserId(userId);

		if (!sessionToken) {
			throw new NotFoundLoggableException(OauthSessionToken.name, { userId: userId });
		}

		return sessionToken;
	}
}
