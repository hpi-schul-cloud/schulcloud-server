import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Injectable } from '@nestjs/common';
import { LtiToolDO, Pseudonym, Team, UserDO } from '@shared/domain';
import { TeamsRepo } from '@shared/repo';
import { PseudonymService } from '@src/modules/pseudonym';
import { UserService } from '@src/modules/user';
import { ExternalToolDO } from '@src/modules/tool/external-tool/domainobject';
import { GroupNameIdTuple, IdToken, OauthScope } from '../interface';
import { OauthProviderLoginFlowService } from './oauth-provider.login-flow.service';
import { IdTokenCreationLoggableException } from '../error/id-token-creation-exception.loggable';

@Injectable()
export class IdTokenService {
	private readonly host: string;

	protected iFrameProperties: string;

	constructor(
		private readonly oauthProviderLoginFlowService: OauthProviderLoginFlowService,
		private readonly pseudonymService: PseudonymService,
		private readonly teamsRepo: TeamsRepo,
		private readonly userService: UserService
	) {
		this.host = Configuration.get('HOST') as string;
		this.iFrameProperties = 'title="username" style="height: 26px; width: 180px; border: none;"';
	}

	async createIdToken(userId: string, scopes: string[], clientId: string): Promise<IdToken> {
		let teams: Team[] = [];
		if (scopes.includes(OauthScope.GROUPS)) {
			teams = await this.teamsRepo.findByUserId(userId);
		}

		const user: UserDO = await this.userService.findById(userId);
		const name: string = await this.userService.getDisplayName(user);
		const iframe: string | undefined = await this.createIframeSubject(user, clientId);
		const groups: GroupNameIdTuple[] = this.buildGroupsClaim(teams);

		return {
			iframe,
			email: scopes.includes(OauthScope.EMAIL) ? user.email : undefined,
			name: scopes.includes(OauthScope.PROFILE) ? name : undefined,
			userId: scopes.includes(OauthScope.PROFILE) ? user.id : undefined,
			schoolId: user.schoolId,
			groups: scopes.includes(OauthScope.GROUPS) ? groups : undefined,
		};
	}

	private buildGroupsClaim(teams: Team[]): GroupNameIdTuple[] {
		return teams.map((team: Team): GroupNameIdTuple => {
			return {
				gid: team.id,
				displayName: team.name,
			};
		});
	}

	// TODO N21-335 How we can refactor the iframe in the id token?
	private async createIframeSubject(user: UserDO, clientId: string): Promise<string> {
		const tool: ExternalToolDO | LtiToolDO = await this.oauthProviderLoginFlowService.findToolByClientId(clientId);

		if (!tool.id) {
			throw new IdTokenCreationLoggableException(clientId, user.id);
		}

		const pseudonym: Pseudonym = await this.pseudonymService.findByUserAndTool(user, tool);

		return `<iframe src="${this.host}/oauth2/username/${pseudonym.pseudonym}" ${this.iFrameProperties}></iframe>`;
	}
}
