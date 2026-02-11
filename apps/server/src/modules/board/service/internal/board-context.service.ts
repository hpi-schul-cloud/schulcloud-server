import { CourseService } from '@modules/course';
import { RoomService } from '@modules/room';
import { RoomMembershipService, UserWithRoomRoles } from '@modules/room-membership';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import {
	AnyBoardNode,
	BoardContextSettings,
	BoardExternalReferenceType,
	BoardRoles,
	UserWithBoardRoles,
} from '../../domain';

@Injectable()
export class BoardContextService {
	constructor(
		private readonly courseService: CourseService,
		private readonly roomService: RoomService,
		private readonly roomMembershipService: RoomMembershipService
	) {}

	public async getUsersWithBoardRoles(rootNode: AnyBoardNode): Promise<UserWithBoardRoles[]> {
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

	public async getBoardSettings(rootNode: AnyBoardNode): Promise<BoardContextSettings> {
		if (!('context' in rootNode)) {
			return {};
		}

		if (rootNode.context.type === BoardExternalReferenceType.Room) {
			const room = await this.roomService.getSingleRoom(rootNode.context.id);
			const canRoomEditorManageVideoconference = this.roomService.canEditorManageVideoconferences(room);
			return {
				canRoomEditorManageVideoconference,
			};
		} else if (rootNode.context.type === BoardExternalReferenceType.Course) {
			return {};
		} else if (rootNode.context.type === BoardExternalReferenceType.User) {
			return {};
		} else {
			throw new Error(`Unknown context type: '${rootNode.context.type as string}'`);
		}
	}

	private async getFromRoom(roomId: EntityId): Promise<UserWithBoardRoles[]> {
		const roomAuthorizable = await this.roomMembershipService.getRoomAuthorizable(roomId);
		const usersWithRoles: UserWithBoardRoles[] = roomAuthorizable.members.map((member) => {
			const roles = this.getBoardRolesFromRoomMembership(member);
			return {
				userId: member.userId,
				roles,
			};
		});
		return usersWithRoles;
	}

	private async getFromCourse(courseId: EntityId): Promise<UserWithBoardRoles[]> {
		const course = await this.courseService.findById(courseId);
		const usersWithRoles: UserWithBoardRoles[] = [
			...course
				.getTeachersList()
				.filter((user) => user.schoolId === course.school.id)
				.map((user) => {
					return {
						userId: user.id,
						firstName: user.firstName,
						lastName: user.lastName,
						roles: [BoardRoles.EDITOR, BoardRoles.ADMIN],
					};
				}),
			...course
				.getSubstitutionTeachersList()
				.filter((user) => user.schoolId === course.school.id)
				.map((user) => {
					return {
						userId: user.id,
						firstName: user.firstName,
						lastName: user.lastName,
						roles: [BoardRoles.EDITOR, BoardRoles.ADMIN],
					};
				}),
			...course
				.getStudentsList()
				.filter((user) => user.schoolId === course.school.id)
				.map((user) => {
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
				roles: [BoardRoles.EDITOR, BoardRoles.ADMIN],
			},
		];

		return usersWithRoles;
	}

	private getBoardRolesFromRoomMembership(member: UserWithRoomRoles): BoardRoles[] {
		const isReader = member.roles.flatMap((role) => role.permissions ?? []).includes(Permission.ROOM_LIST_CONTENT);
		const isEditor = member.roles.flatMap((role) => role.permissions ?? []).includes(Permission.ROOM_EDIT_CONTENT);

		const isRoomAdmin = member.roles.flatMap((role) => role.permissions ?? []).includes(Permission.ROOM_ADD_MEMBERS);
		const isRoomOwner = member.roles.flatMap((role) => role.permissions ?? []).includes(Permission.ROOM_CHANGE_OWNER);
		const isBoardAdmin = isRoomAdmin || isRoomOwner;

		if (isBoardAdmin) {
			return [BoardRoles.EDITOR, BoardRoles.ADMIN];
		}
		if (isEditor) {
			return [BoardRoles.EDITOR];
		}
		if (isReader) {
			return [BoardRoles.READER];
		}
		return [];
	}
}
