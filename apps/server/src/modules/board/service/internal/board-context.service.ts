import { CourseService } from '@modules/course';
import { RoomMembershipService, UserWithRoomRoles } from '@modules/room-membership';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import {
	AnyBoardNode,
	BoardExternalReferenceType,
	BoardRoles,
	BoardContextSettings,
	UserWithBoardRoles,
} from '../../domain';
import { RoomService } from '@modules/room';

export type BoardAuthContext = { users: UserWithBoardRoles[]; schoolId: EntityId | undefined };

@Injectable()
export class BoardContextService {
	constructor(
		private readonly courseService: CourseService,
		private readonly roomService: RoomService,
		private readonly roomMembershipService: RoomMembershipService
	) {}

	public async getUsersWithBoardRoles(rootNode: AnyBoardNode): Promise<BoardAuthContext> {
		if (!('context' in rootNode)) {
			return { users: [], schoolId: undefined };
		}

		let authContext: BoardAuthContext;

		if (rootNode.context.type === BoardExternalReferenceType.Room) {
			authContext = await this.getFromRoom(rootNode.context.id);
		} else if (rootNode.context.type === BoardExternalReferenceType.Course) {
			authContext = await this.getFromCourse(rootNode.context.id);
		} else if (rootNode.context.type === BoardExternalReferenceType.User) {
			authContext = this.getFromUser(rootNode.context.id);
		} else {
			throw new Error(`Unknown context type: '${rootNode.context.type as string}'`);
		}

		return authContext;
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

	private async getFromRoom(roomId: EntityId): Promise<BoardAuthContext> {
		const roomMembershipAuthorizable = await this.roomMembershipService.getRoomMembershipAuthorizable(roomId);
		const usersWithRoles: UserWithBoardRoles[] = roomMembershipAuthorizable.members.map((member) => {
			const roles = this.getBoardRolesFromRoomMembership(member);
			return {
				userId: member.userId,
				roles,
			};
		});

		const room = await this.roomService.getSingleRoom(roomId);

		return { users: usersWithRoles, schoolId: room.schoolId };
	}

	private async getFromCourse(courseId: EntityId): Promise<BoardAuthContext> {
		const course = await this.courseService.findById(courseId);
		const usersWithRoles: UserWithBoardRoles[] = [
			...course.getTeachersList().map((user) => {
				return {
					userId: user.id,
					firstName: user.firstName,
					lastName: user.lastName,
					roles: [BoardRoles.EDITOR, BoardRoles.ADMIN],
				};
			}),
			...course.getSubstitutionTeachersList().map((user) => {
				return {
					userId: user.id,
					firstName: user.firstName,
					lastName: user.lastName,
					roles: [BoardRoles.EDITOR, BoardRoles.ADMIN],
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

		return { users: usersWithRoles, schoolId: course.school.id };
	}

	private getFromUser(userId: EntityId): BoardAuthContext {
		const usersWithRoles: UserWithBoardRoles[] = [
			{
				userId,
				roles: [BoardRoles.EDITOR, BoardRoles.ADMIN],
			},
		];

		return { users: usersWithRoles, schoolId: undefined };
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
