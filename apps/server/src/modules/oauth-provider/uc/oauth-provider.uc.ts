import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types/entity-id';
import { ProviderConsentSessionResponse } from '@shared/infra/oauth-provider/dto/response/consent-session.response';
import { OauthProviderService } from '@shared/infra/oauth-provider/oauth-provider.service';

@Injectable()
export class OauthProviderUc {
	constructor(private readonly oauthProviderService: OauthProviderService) {}

	listConsentSessions(userId: EntityId): Promise<ProviderConsentSessionResponse[]> {
		const sessions: Promise<ProviderConsentSessionResponse[]> = this.oauthProviderService.listConsentSessions(userId);
		return sessions;
	}

	revokeConsentSession(userId: EntityId, clientId: string): Promise<void> {
		const promise: Promise<void> = this.oauthProviderService.revokeConsentSession(userId, clientId);
		return promise;
	}
}
