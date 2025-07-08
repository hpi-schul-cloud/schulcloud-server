import { RoleName } from '@modules/role';
import { Role } from '@modules/role/repo';
import { roleFactory } from '@modules/role/testing';
import { Permission } from '@shared/domain/interface';

export class RoomRolesTestFactory {
	public static createRoomRoles(): {
		roomOwnerRole: Role;
		roomAdminRole: Role;
		roomEditorRole: Role;
		roomViewerRole: Role;
		roomApplicantRole: Role;
	} {
		const roomOwnerRole = roleFactory.buildWithId({
			name: RoleName.ROOMOWNER,
			permissions: [
				Permission.ROOM_LIST_CONTENT,
				Permission.ROOM_EDIT_ROOM,
				Permission.ROOM_CONTENT_EDIT,
				Permission.ROOM_ADD_MEMBERS,
				Permission.ROOM_REMOVE_MEMBERS,
				Permission.ROOM_CHANGE_ROLES,
				Permission.ROOM_DELETE_ROOM,
				Permission.ROOM_CHANGE_OWNER,
				Permission.ROOM_COPY_ROOM,
				Permission.ROOM_SHARE_ROOM,
			],
		});
		const roomAdminRole = roleFactory.buildWithId({
			name: RoleName.ROOMADMIN,
			permissions: [
				Permission.ROOM_LIST_CONTENT,
				Permission.ROOM_EDIT_ROOM,
				Permission.ROOM_CONTENT_EDIT,
				Permission.ROOM_ADD_MEMBERS,
				Permission.ROOM_REMOVE_MEMBERS,
				Permission.ROOM_CHANGE_ROLES,
				Permission.ROOM_LEAVE_ROOM,
				Permission.ROOM_COPY_ROOM,
				Permission.ROOM_SHARE_ROOM,
			],
		});
		const roomEditorRole = roleFactory.buildWithId({
			name: RoleName.ROOMEDITOR,
			permissions: [Permission.ROOM_LIST_CONTENT, Permission.ROOM_CONTENT_EDIT, Permission.ROOM_LEAVE_ROOM],
		});
		const roomViewerRole = roleFactory.buildWithId({
			name: RoleName.ROOMVIEWER,
			permissions: [Permission.ROOM_LIST_CONTENT, Permission.ROOM_LEAVE_ROOM],
		});
		const roomApplicantRole = roleFactory.buildWithId({
			name: RoleName.ROOMAPPLICANT,
			permissions: [],
		});

		return {
			roomOwnerRole,
			roomAdminRole,
			roomEditorRole,
			roomViewerRole,
			roomApplicantRole,
		};
	}
}
