import { ObjectId } from '@mikro-orm/mongodb';
import { Permission } from '@shared/domain/interface';
import { columnBoardFactory, columnFactory } from '../testing';
import { BoardConfiguration, BoardNodeAuthorizable, BoardRoles } from './board-node-authorizable.do';
import { ColumnBoardProps } from './types';

describe('Board Node Authorizable Domain Object', () => {
	const setup = (props?: { boardConfiguration?: BoardConfiguration; rootPartial?: Partial<ColumnBoardProps> }) => {
		const readerId = new ObjectId().toString();
		const editorId = new ObjectId().toString();
		const adminId = new ObjectId().toString();
		const anyBoardDo = columnFactory.build();

		const boardNodeAuthorizable = new BoardNodeAuthorizable({
			users: [
				{ userId: readerId, roles: [BoardRoles.READER] },
				{ userId: editorId, roles: [BoardRoles.EDITOR] },
				{ userId: adminId, roles: [BoardRoles.ADMIN] },
			],
			id: anyBoardDo.id,
			boardNode: anyBoardDo,
			rootNode: columnBoardFactory.build(props?.rootPartial),
			boardConfiguration: props?.boardConfiguration || {},
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
			expect(permissions).toEqual([Permission.BOARD_VIEW, Permission.BOARD_EDIT, Permission.BOARD_MANAGE]);
		});

		it('should return admin permissions', () => {
			const { boardNodeAuthorizable, adminId } = setup();
			const permissions = boardNodeAuthorizable.getUserPermissions(adminId);
			expect(permissions).toEqual([
				Permission.BOARD_VIEW,
				Permission.BOARD_EDIT,
				Permission.BOARD_MANAGE_VIDEOCONFERENCE,
				Permission.BOARD_MANAGE_READERS_CAN_EDIT,
				Permission.BOARD_MANAGE,
				Permission.BOARD_SHARE_BOARD,
				Permission.BOARD_RELOCATE_CONTENT,
			]);
		});
	});
});
