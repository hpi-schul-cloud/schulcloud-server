import { OauthProviderService } from '@infra/oauth-provider';
import { ProviderConsentSessionResponse } from '@infra/oauth-provider/dto/';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

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
