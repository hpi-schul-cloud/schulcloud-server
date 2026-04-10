import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { TeamAuthorisableService } from '../domain';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { Permission } from '@shared/domain/interface';

@Injectable()
export class TeamUc {
	constructor(
		private readonly teamAuthorisableService: TeamAuthorisableService,
		private readonly authorizationService: AuthorizationService
	) {}

	public async createRoomWithTeamMembers(userId: EntityId, teamId: EntityId): Promise<{ roomId: string }> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const team = await this.teamAuthorisableService.findById(teamId);

		this.authorizationService.checkPermission(
			user,
			team,
			AuthorizationContextBuilder.write([Permission.TEAM_EXPORT_TO_ROOM, Permission.SCHOOL_CREATE_ROOM])
		);

		return Promise.resolve({ roomId: '1234123412341234' });
	}
}
