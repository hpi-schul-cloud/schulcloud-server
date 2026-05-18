import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { TeamAuthorisableService } from '../domain';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { Permission } from '@shared/domain/interface';
import { TEAM_PUBLIC_API_CONFIG_TOKEN, TeamPublicApiConfig } from '../team.config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception/feature-disabled.loggable-exception';
import { RoomService } from '@modules/room';
import { RoomMembershipService } from '@modules/room-membership';
import { mapTeamColorToRoomColor } from './helper/colormapper';
import { RoleName } from '@modules/role';
import { UserService } from '@modules/user';

@Injectable()
export class TeamUc {
	constructor(
		private readonly teamAuthorisableService: TeamAuthorisableService,
		private readonly authorizationService: AuthorizationService,
		private readonly roomService: RoomService,
		private readonly roomMembershipService: RoomMembershipService,
		private readonly userService: UserService,
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

		const room = await this.roomService.createRoom({
			name: team.name,
			color: mapTeamColorToRoomColor(team.color),
			schoolId: user.school.id,
			features: [],
		});

		try {
			await this.roomMembershipService.createNewRoomMembership(room.id, userId);

			const userIds = team.teamUsers.map((teamUser) => teamUser.userId.id).filter((id) => id !== userId);
			const users = await this.userService.findByIds(userIds);
			const finalUsers = users
				.filter((user) => user.roles.some((role) => role.name === 'student' || role.name === 'teacher'))
				.map((user) => user.id)
				.filter((id) => id !== undefined);

			await this.roomMembershipService.addMembersToRoom(room.id, finalUsers, RoleName.ROOMVIEWER);
		} catch (error) {
			await this.roomService.deleteRoom(room);
			throw error;
		}

		return { roomId: room.id };
	}
}
