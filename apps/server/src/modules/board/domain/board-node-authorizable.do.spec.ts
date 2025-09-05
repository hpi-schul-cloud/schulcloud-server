import { columnBoardFactory } from '../testing';
import { BoardNodeAuthorizable, BoardRoles, BoardContextSettings } from './board-node-authorizable.do';
import { Permission } from '@shared/domain/interface';
import { ObjectId } from 'bson';

describe('Board Node Authorizable Domain Object', () => {
	const setup = (boardSettings?: BoardContextSettings) => {
		const readerId = new ObjectId().toString();
		const editorId = new ObjectId().toString();
		const adminId = new ObjectId().toString();
		const anyBoardDo = columnBoardFactory.build();

		const boardNodeAuthorizable = new BoardNodeAuthorizable({
			users: [
				{ userId: readerId, roles: [BoardRoles.READER] },
				{ userId: editorId, roles: [BoardRoles.EDITOR] },
				{ userId: adminId, roles: [BoardRoles.ADMIN] },
			],
			id: anyBoardDo.id,
			boardNode: anyBoardDo,
			rootNode: columnBoardFactory.build(),
			boardContextSettings: boardSettings || {},
		});

		return { anyBoardDo, boardNodeAuthorizable, readerId, editorId, adminId };
	};

	describe('getUserPermissions', () => {
		it('should return reader permissions', () => {
			const { boardNodeAuthorizable, readerId } = setup();
			const permissions = boardNodeAuthorizable.getUserPermissions(readerId);
			expect(permissions).toEqual([Permission.BOARD_VIEW]);
		});

		it('should return editor permissions', () => {
			const { boardNodeAuthorizable, editorId } = setup();
			const permissions = boardNodeAuthorizable.getUserPermissions(editorId);
			expect(permissions).toEqual([Permission.BOARD_VIEW, Permission.BOARD_EDIT]);
		});

		it('when canRoomEditorManageVideoconference is enabled, editor should get videoconference permission', () => {
			const { boardNodeAuthorizable, editorId } = setup({ canRoomEditorManageVideoconference: true });
			const permissions = boardNodeAuthorizable.getUserPermissions(editorId);
			expect(permissions).toEqual(expect.arrayContaining([Permission.BOARD_MANAGE_VIDEOCONFERENCE]));
		});

		it('should return admin permissions', () => {
			const { boardNodeAuthorizable, adminId } = setup();
			const permissions = boardNodeAuthorizable.getUserPermissions(adminId);
			expect(permissions).toEqual([
				Permission.BOARD_VIEW,
				Permission.BOARD_EDIT,
				Permission.BOARD_MANAGE_VIDEOCONFERENCE,
				Permission.BOARD_MANAGE_READERS_CAN_EDIT,
				Permission.BOARD_SHARE_BOARD,
			]);
		});
	});
});
