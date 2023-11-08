import { Injectable } from '@nestjs/common';
import { OauthProviderService } from '@infra/oauth-provider';
import { EntityId } from '@shared/domain';
import { ProviderConsentSessionResponse } from '@infra/oauth-provider/dto/';

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
