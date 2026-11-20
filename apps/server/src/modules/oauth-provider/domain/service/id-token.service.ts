import { PseudonymService } from '@modules/pseudonym';
import { UserDo, UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { IdTokenCreationLoggableException } from '../error';
import { IdToken, OauthScope } from '../interface';
import { OauthProviderLoginFlowService } from './oauth-provider.login-flow.service';

@Injectable()
export class IdTokenService {
	constructor(
		private readonly oauthProviderLoginFlowService: OauthProviderLoginFlowService,
		private readonly pseudonymService: PseudonymService,
		private readonly userService: UserService
	) {}

	public async createIdToken(userId: string, scopes: string[], clientId: string): Promise<IdToken> {
		const user = await this.userService.findById(userId);
		const name = await this.userService.getDisplayName(user);
		const iframe = await this.createIframeSubject(user, clientId);

		return {
			iframe,
			email: scopes.includes(OauthScope.EMAIL) ? user.email : undefined,
			name: scopes.includes(OauthScope.PROFILE) ? name : undefined,
			userId: scopes.includes(OauthScope.PROFILE) ? user.id : undefined,
			schoolId: user.schoolId,
			groups: scopes.includes(OauthScope.GROUPS) ? [] : undefined,
		};
	}

	// TODO N21-335 How we can refactor the iframe in the id token?
	private async createIframeSubject(user: UserDo, clientId: string): Promise<string> {
		const tool = await this.oauthProviderLoginFlowService.findToolByClientId(clientId);

		if (!tool.id) {
			throw new IdTokenCreationLoggableException(clientId, user.id);
		}

		const pseudonym = await this.pseudonymService.findByUserAndToolOrThrow(user, tool);

		const iframeSubject = this.pseudonymService.getIframeSubject(pseudonym.pseudonym);

		return iframeSubject;
	}
}
