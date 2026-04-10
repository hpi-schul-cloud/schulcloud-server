import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { TeamAuthorisableService } from '../domain';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { Permission } from '@shared/domain/interface';
import { TEAM_PUBLIC_API_CONFIG_TOKEN, TeamPublicApiConfig } from '../team.config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception/feature-disabled.loggable-exception';

@Injectable()
export class TeamUc {
	constructor(
		private readonly teamAuthorisableService: TeamAuthorisableService,
		private readonly authorizationService: AuthorizationService,
		@Inject(TEAM_PUBLIC_API_CONFIG_TOKEN) private readonly config: TeamPublicApiConfig
	) {}

	public async createRoomWithTeamMembers(userId: EntityId, teamId: EntityId): Promise<{ roomId: string }> {
		if (!this.config.featureTeamCreateRoomEnabled) {
			throw new FeatureDisabledLoggableException('FEATURE_TEAM_CREATE_ROOM_ENABLED');
		}

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const team = await this.teamAuthorisableService.findById(teamId);

		this.authorizationService.checkPermission(
			user,
			team,
			AuthorizationContextBuilder.write([Permission.TEAM_EXPORT_TO_ROOM])
		);
		this.authorizationService.checkAllPermissions(user, [Permission.SCHOOL_CREATE_ROOM]);

		return Promise.resolve({ roomId: '1234123412341234' });
	}
}
