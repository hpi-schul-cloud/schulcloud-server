import { RoleName } from '@modules/role';
import { Room, RoomFeatures } from '@modules/room';
import { RoomAuthorizable, UserWithRoomRoles } from '@modules/room-membership';
import { Permission } from '@shared/domain/interface';
import {
	BoardConfiguration,
	BoardExternalReferenceType,
	BoardRoles,
	ColumnBoard,
	MediaBoard,
	UserWithBoardRoles,
} from '../../../domain';
import { PreparedBoardContext } from './prepared-board-context.interface';

/**
 * Prepared context for Room-based boards.
 * Holds pre-fetched Room and RoomAuthorizable data.
 */
export class RoomBoardContext implements PreparedBoardContext {
	public readonly type = BoardExternalReferenceType.Room;

	private readonly usersWithBoardRoles: UserWithBoardRoles[];

	private readonly hasOwner: boolean;

	private readonly canEditorsManageVideoconference: boolean;

	constructor(private readonly room: Room, private readonly roomAuthorizable: RoomAuthorizable) {
		this.usersWithBoardRoles = this.computeUsersWithBoardRoles();
		this.hasOwner = this.computeHasOwner();
		this.canEditorsManageVideoconference = this.room.features.includes(RoomFeatures.EDITOR_MANAGE_VIDEOCONFERENCE);
	}

	public getUsersWithBoardRoles(): UserWithBoardRoles[] {
		return this.usersWithBoardRoles;
	}

	public getBoardConfiguration(rootNode: MediaBoard | ColumnBoard): BoardConfiguration {
		const isColumnBoard = rootNode instanceof ColumnBoard;

		return {
			canEditorsManageVideoconference: isColumnBoard && this.canEditorsManageVideoconference,
			canReadersEdit: this.determineCanReadersEdit(rootNode),
			canAdminsToggleReadersCanEdit: isColumnBoard,
			isLocked: !this.hasOwner,
		};
	}

	private computeUsersWithBoardRoles(): UserWithBoardRoles[] {
		return this.roomAuthorizable.members.map((member) => {
			return {
				userId: member.userId,
				roles: this.getBoardRolesFromRoomMembership(member),
			};
		});
	}

	private computeHasOwner(): boolean {
		return this.roomAuthorizable.members.some((member) =>
			member.roles.some((role) => role.name === RoleName.ROOMOWNER)
		);
	}

	private determineCanReadersEdit(rootNode: MediaBoard | ColumnBoard): boolean {
		if ('readersCanEdit' in rootNode && rootNode.readersCanEdit !== undefined) {
			return rootNode.readersCanEdit;
		}
		return false;
	}

	private getBoardRolesFromRoomMembership(member: UserWithRoomRoles): BoardRoles[] {
		const permissions = member.roles.flatMap((role) => role.permissions ?? []);

		const isReader = permissions.includes(Permission.ROOM_LIST_CONTENT);
		const isEditor = permissions.includes(Permission.ROOM_EDIT_CONTENT);
		const isRoomAdmin = permissions.includes(Permission.ROOM_ADD_MEMBERS);
		const isRoomOwner = permissions.includes(Permission.ROOM_CHANGE_OWNER);
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
