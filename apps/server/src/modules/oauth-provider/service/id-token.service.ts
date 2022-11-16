import {EntityId, PseudonymDO, Team} from '@shared/domain';
import { Injectable } from '@nestjs/common';
import { GroupNameIdTuple, IdToken } from '@src/modules/oauth-provider/interface/id-token';
import { LtiToolRepo, PseudonymsRepo, TeamsRepo } from '@shared/repo';
import { OauthScope } from '@src/modules/oauth-provider/interface/oauth-scope.enum';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import { UserService } from '@src/modules/user/service/user.service';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Logger } from '@src/core/logger';
import {RoleService} from "@src/modules/role/service/role.service";
import {RoleDto} from "@src/modules/role/service/dto/role.dto";

@Injectable()
export class IdTokenService {
	private readonly host: string;

	protected iFrameProperties: string;

	constructor(
		private readonly pseudonymsRepo: PseudonymsRepo,
		private readonly ltiToolRepo: LtiToolRepo,
		private readonly teamsRepo: TeamsRepo,
		private readonly userService: UserService,
		private readonly roleService: RoleService,
		private readonly logger: Logger
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

		const roleIds: EntityId[] = userDto.roleIds;
		let roleNames: string[] = [];
		for(let i = 0; i < roleIds.length ; i++) {
			let userRoleDto: RoleDto = await this.roleService.findById(roleIds[i]);
			roleNames.push(userRoleDto.name);
		}

		return {
			iframe,
			email: scopes.includes(OauthScope.EMAIL) ? userDto.email : undefined,
			name: scopes.includes(OauthScope.PROFILE) ? name : undefined,
			userId: scopes.includes(OauthScope.PROFILE) ? userDto.id : undefined,
			schoolId: userDto.schoolId,
			groups: scopes.includes(OauthScope.GROUPS) ? groups : undefined,
			userRole: scopes.includes(OauthScope.USERROLE) ? roleNames : undefined,
			// ToDo: add fedState, if the federalState is migrated to NEST
			// fedState: scopes.includes(OauthScope.FEDERALSTATE) ? userDto.id : undefined,
		};
	}

	protected buildGroupsClaim(teams: Team[]): GroupNameIdTuple[] {
		return teams.map(
			(team: Team): GroupNameIdTuple => ({
				gid: team.id,
				displayName: team.name,
			})
		);
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
