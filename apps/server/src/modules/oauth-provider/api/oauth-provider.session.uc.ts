import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ProviderConsentSessionResponse } from '../domain';
import { OauthProviderService } from '../domain/service/oauth-provider.service';

@Injectable()
export class OauthProviderSessionUc {
	constructor(private readonly oauthProviderService: OauthProviderService) {}

	public async listConsentSessions(userId: EntityId): Promise<ProviderConsentSessionResponse[]> {
		const sessions: ProviderConsentSessionResponse[] = await this.oauthProviderService.listConsentSessions(userId);

		return sessions;
	}

	public async revokeConsentSession(userId: EntityId, clientId: string): Promise<void> {
		await this.oauthProviderService.revokeConsentSession(userId, clientId);
	}
}
