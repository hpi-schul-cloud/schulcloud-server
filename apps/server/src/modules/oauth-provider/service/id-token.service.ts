import { Injectable } from '@nestjs/common';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { Pseudonym } from '@shared/domain/domainobject/pseudonym.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { TeamEntity } from '@shared/domain/entity/team.entity';
import { TeamsRepo } from '@shared/repo/teams/teams.repo';
import { PseudonymService } from '@src/modules/pseudonym/service/pseudonym.service';
import { ExternalTool } from '@src/modules/tool/external-tool/domain/external-tool.do';
import { UserService } from '@src/modules/user/service/user.service';
import { IdTokenCreationLoggableException } from '../error/id-token-creation-exception.loggable';
import { IdToken, GroupNameIdTuple } from '../interface/id-token';
import { OauthScope } from '../interface/oauth-scope.enum';
import { OauthProviderLoginFlowService } from './oauth-provider.login-flow.service';

@Injectable()
export class IdTokenService {
	constructor(
		private readonly oauthProviderLoginFlowService: OauthProviderLoginFlowService,
		private readonly pseudonymService: PseudonymService,
		private readonly teamsRepo: TeamsRepo,
		private readonly userService: UserService
	) {}

	async createIdToken(userId: string, scopes: string[], clientId: string): Promise<IdToken> {
		let teams: TeamEntity[] = [];
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

	private buildGroupsClaim(teams: TeamEntity[]): GroupNameIdTuple[] {
		return teams.map((team: TeamEntity): GroupNameIdTuple => {
			return {
				gid: team.id,
				displayName: team.name,
			};
		});
	}

	// TODO N21-335 How we can refactor the iframe in the id token?
	private async createIframeSubject(user: UserDO, clientId: string): Promise<string> {
		const tool: ExternalTool | LtiToolDO = await this.oauthProviderLoginFlowService.findToolByClientId(clientId);

		if (!tool.id) {
			throw new IdTokenCreationLoggableException(clientId, user.id);
		}

		const pseudonym: Pseudonym = await this.pseudonymService.findByUserAndToolOrThrow(user, tool);

		const iframeSubject: string = this.pseudonymService.getIframeSubject(pseudonym.pseudonym);

		return iframeSubject;
	}
}
