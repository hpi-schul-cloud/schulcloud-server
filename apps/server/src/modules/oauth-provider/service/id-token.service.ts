import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ExternalToolDO, PseudonymDO, Team, UserDO } from '@shared/domain';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { TeamsRepo } from '@shared/repo';
import { GroupNameIdTuple, IdToken } from '@src/modules/oauth-provider/interface/id-token';
import { OauthScope } from '@src/modules/oauth-provider/interface/oauth-scope.enum';
import { PseudonymService } from '@src/modules/pseudonym/service';
import { UserService } from '@src/modules/user/service/user.service';
import { OauthProviderLoginFlowService } from './oauth-provider.login-flow.service';

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
		const iframe: string | undefined = await this.createIframeSubject(userId, clientId);
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
	private async createIframeSubject(userId: string, clientId: string): Promise<string> {
		const tool: ExternalToolDO | LtiToolDO = await this.oauthProviderLoginFlowService.findToolByClientId(clientId);

		if (!tool.id) {
			throw new InternalServerErrorException(
				`Something went wrong for id token creation. Tool could not be found for userId: ${userId} and clientId: ${clientId}`
			);
		}

		const pseudonymDO: PseudonymDO = await this.pseudonymService.findByUserIdAndToolId(userId, tool.id);

		return `<iframe src="${this.host}/oauth2/username/${pseudonymDO.pseudonym}" ${this.iFrameProperties}></iframe>`;
	}
}
