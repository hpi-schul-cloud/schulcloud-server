import { PseudonymService } from '@modules/pseudonym';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { LtiToolDO, Pseudonym, UserDO } from '@shared/domain/domainobject';
import { TeamEntity } from '@shared/domain/entity';
import { TeamsRepo } from '@shared/repo';
import { IdTokenCreationLoggableException } from '../error';
import { GroupNameIdTuple, IdToken, OauthScope } from '../interface';
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
