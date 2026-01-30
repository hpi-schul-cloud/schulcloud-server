import { ObjectId } from '@mikro-orm/mongodb';
import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { UUID } from 'bson';
import { TOOL_CONFIG_TOKEN, ToolConfig } from '../../tool-config';
import { LtiDeepLinkToken } from '../domain';
import { LTI_DEEP_LINK_TOKEN_REPO, LtiDeepLinkTokenRepo } from '../repo';

@Injectable()
export class LtiDeepLinkTokenService {
	constructor(
		@Inject(LTI_DEEP_LINK_TOKEN_REPO) private readonly ltiDeepLinkTokenRepo: LtiDeepLinkTokenRepo,
		@Inject(TOOL_CONFIG_TOKEN) private readonly config: ToolConfig
	) {}

	public async generateToken(userId: EntityId): Promise<LtiDeepLinkToken> {
		const tokenDurationMs = this.config.ctlToolsReloadTimeMs;
		const ltiDeepLinkToken: LtiDeepLinkToken = await this.ltiDeepLinkTokenRepo.save(
			new LtiDeepLinkToken({
				id: new ObjectId().toHexString(),
				userId,
				state: new UUID().toString(),
				expiresAt: new Date(Date.now() + tokenDurationMs),
			})
		);

		return ltiDeepLinkToken;
	}

	public async findByState(state: string): Promise<LtiDeepLinkToken | null> {
		const ltiDeepLinkToken: LtiDeepLinkToken | null = await this.ltiDeepLinkTokenRepo.findByState(state);

		return ltiDeepLinkToken;
	}
}
