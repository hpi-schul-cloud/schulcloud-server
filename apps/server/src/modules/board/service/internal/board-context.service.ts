import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { CourseRepo } from '@shared/repo';
import { RoomMemberService } from '@src/modules/room-member';
import { UserWithRoomRoles } from '@src/modules/room-member/do/room-member-authorizable.do';
import { AnyBoardNode, BoardExternalReferenceType, BoardRoles, UserWithBoardRoles } from '../../domain';

@Injectable()
export class BoardContextService {
	constructor(private readonly courseRepo: CourseRepo, private readonly roomMemberService: RoomMemberService) {}

	async getUsersWithBoardRoles(rootNode: AnyBoardNode): Promise<UserWithBoardRoles[]> {
		if (!('context' in rootNode)) {
			return [];
		}

		let usersWithRoles: UserWithBoardRoles[] = [];

		if (rootNode.context.type === BoardExternalReferenceType.Room) {
			usersWithRoles = await this.getFromRoom(rootNode.context.id);
		} else if (rootNode.context.type === BoardExternalReferenceType.Course) {
			usersWithRoles = await this.getFromCourse(rootNode.context.id);
		} else if (rootNode.context.type === BoardExternalReferenceType.User) {
			usersWithRoles = this.getFromUser(rootNode.context.id);
		} else {
			throw new Error(`Unknown context type: '${rootNode.context.type as string}'`);
		}

		return usersWithRoles;
	}

	private async getFromRoom(roomId: EntityId): Promise<UserWithBoardRoles[]> {
		const roomMemberAuthorizable = await this.roomMemberService.getRoomMemberAuthorizable(roomId);
		const usersWithRoles: UserWithBoardRoles[] = roomMemberAuthorizable.members.map((member) => {
			const roles = this.getBoardRolesFromRoomMember(member);
			return {
				userId: member.userId,
				roles,
			};
		});
		return usersWithRoles;
	}

	private async getFromCourse(courseId: EntityId): Promise<UserWithBoardRoles[]> {
		const course = await this.courseRepo.findById(courseId);
		const usersWithRoles: UserWithBoardRoles[] = [
			...course.getTeachersList().map((user) => {
				return {
					userId: user.id,
					firstName: user.firstName,
					lastName: user.lastName,
					roles: [BoardRoles.EDITOR],
				};
			}),
			...course.getSubstitutionTeachersList().map((user) => {
				return {
					userId: user.id,
					firstName: user.firstName,
					lastName: user.lastName,
					roles: [BoardRoles.EDITOR],
				};
			}),
			...course.getStudentsList().map((user) => {
				return {
					userId: user.id,
					firstName: user.firstName,
					lastName: user.lastName,
					roles: [BoardRoles.READER],
				};
			}),
		];

		return usersWithRoles;
	}

	private getFromUser(userId: EntityId): UserWithBoardRoles[] {
		const usersWithRoles: UserWithBoardRoles[] = [
			{
				userId,
				roles: [BoardRoles.EDITOR],
			},
		];

		return usersWithRoles;
	}

	private getBoardRolesFromRoomMember(member: UserWithRoomRoles): BoardRoles[] {
		const isReader = member.roles.flatMap((role) => role.permissions ?? []).includes(Permission.ROOM_VIEW);
		const isEditor = member.roles.flatMap((role) => role.permissions ?? []).includes(Permission.ROOM_EDIT);

		if (isEditor) {
			return [BoardRoles.EDITOR];
		}
		if (isReader) {
			return [BoardRoles.READER];
		}
		return [];
	}
}
