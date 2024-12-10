import { ObjectId } from '@mikro-orm/mongodb';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityId } from '@shared/domain/types';
import { UUID } from 'bson';
import { ToolConfig } from '../../tool-config';
import { LtiDeepLinkToken } from '../domain';
import { LTI_DEEP_LINK_TOKEN_REPO, LtiDeepLinkTokenRepo } from '../repo';

@Injectable()
export class LtiDeepLinkTokenService {
	constructor(
		@Inject(LTI_DEEP_LINK_TOKEN_REPO) private readonly ltiDeepLinkTokenRepo: LtiDeepLinkTokenRepo,
		private readonly configService: ConfigService<ToolConfig, true>
	) {}

	public async generateToken(userId: EntityId): Promise<LtiDeepLinkToken> {
		const tokenDurationMs = this.configService.get<number>('CTL_TOOLS_RELOAD_TIME_MS');

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
