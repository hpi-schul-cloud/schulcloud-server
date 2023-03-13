import { PseudonymDO, Team } from '@shared/domain';
import { Injectable } from '@nestjs/common';
import { GroupNameIdTuple, IdToken } from '@src/modules/oauth-provider/interface/id-token';
import { LtiToolRepo, PseudonymsRepo, TeamsRepo } from '@shared/repo';
import { OauthScope } from '@src/modules/oauth-provider/interface/oauth-scope.enum';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { UserService } from '@src/modules/user/service/user.service';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { LegacyLogger } from '@src/core/logger';

@Injectable()
export class IdTokenService {
	private readonly host: string;

	protected iFrameProperties: string;

	constructor(
		private readonly pseudonymsRepo: PseudonymsRepo,
		private readonly ltiToolRepo: LtiToolRepo,
		private readonly teamsRepo: TeamsRepo,
		private readonly userService: UserService,
		private readonly logger: LegacyLogger
	) {
		this.host = Configuration.get('HOST') as string;
		this.iFrameProperties = 'title="username" style="height: 26px; width: 180px; border: none;"';
	}

	async createIdToken(userId: string, scopes: string[], clientId: string): Promise<IdToken> {
		let teams: Team[] = [];
		if (scopes.includes(OauthScope.GROUPS)) {
			teams = await this.teamsRepo.findByUserId(userId);
		}

		const userDto: UserDto = await this.userService.getUser(userId);
		const name: string = await this.userService.getDisplayName(userDto);
		const iframe: string | undefined = await this.createIframeSubject(userId, clientId);
		const groups: GroupNameIdTuple[] = this.buildGroupsClaim(teams);

		return {
			iframe,
			email: scopes.includes(OauthScope.EMAIL) ? userDto.email : undefined,
			name: scopes.includes(OauthScope.PROFILE) ? name : undefined,
			userId: scopes.includes(OauthScope.PROFILE) ? userDto.id : undefined,
			schoolId: userDto.schoolId,
			groups: scopes.includes(OauthScope.GROUPS) ? groups : undefined,
		};
	}

	protected buildGroupsClaim(teams: Team[]): GroupNameIdTuple[] {
		return teams.map((team: Team): GroupNameIdTuple => {
			return {
				gid: team.id,
				displayName: team.name,
			};
		});
	}

	// TODO N21-335 How we can refactor the iframe in the id token?
	protected async createIframeSubject(userId: string, clientId: string): Promise<string | undefined> {
		try {
			const ltiTool: LtiToolDO = await this.ltiToolRepo.findByClientIdAndIsLocal(clientId, true);
			const pseudonymDO: PseudonymDO = await this.pseudonymsRepo.findByUserIdAndToolId(userId, ltiTool.id as string);

			return `<iframe src="${this.host}/oauth2/username/${pseudonymDO.pseudonym}" ${this.iFrameProperties}></iframe>`;
		} catch (err) {
			this.logger.debug(
				`Something went wrong for id token creation. LtiTool or Pseudonym could not be found for userId: ${userId} and clientId: ${clientId}`
			);
			return undefined;
		}
	}
}
