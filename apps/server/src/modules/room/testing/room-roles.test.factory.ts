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
	} {
		const roomOwnerRole = roleFactory.buildWithId({
			name: RoleName.ROOMOWNER,
			permissions: [
				Permission.ROOM_VIEW,
				Permission.ROOM_EDIT,
				Permission.ROOM_MEMBERS_ADD,
				Permission.ROOM_MEMBERS_REMOVE,
				Permission.ROOM_MEMBERS_CHANGE_ROLE,
				Permission.ROOM_DELETE,
				Permission.ROOM_CHANGE_OWNER,
			],
		});
		const roomAdminRole = roleFactory.buildWithId({
			name: RoleName.ROOMADMIN,
			permissions: [
				Permission.ROOM_VIEW,
				Permission.ROOM_EDIT,
				Permission.ROOM_MEMBERS_ADD,
				Permission.ROOM_MEMBERS_REMOVE,
				Permission.ROOM_MEMBERS_CHANGE_ROLE,
			],
		});
		const roomEditorRole = roleFactory.buildWithId({
			name: RoleName.ROOMEDITOR,
			permissions: [Permission.ROOM_VIEW, Permission.ROOM_EDIT],
		});
		const roomViewerRole = roleFactory.buildWithId({
			name: RoleName.ROOMVIEWER,
			permissions: [Permission.ROOM_VIEW],
		});

		return {
			roomOwnerRole,
			roomAdminRole,
			roomEditorRole,
			roomViewerRole,
		};
	}
}
