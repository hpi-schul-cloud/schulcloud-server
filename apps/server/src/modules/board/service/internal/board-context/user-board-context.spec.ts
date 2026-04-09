import { ObjectId } from '@mikro-orm/mongodb';
import { BoardExternalReferenceType, BoardRoles } from '../../../domain';
import { columnBoardFactory, mediaBoardFactory } from '../../../testing';
import { UserBoardContext } from './user-board-context';

describe(UserBoardContext.name, () => {
	describe('constructor', () => {
		it('should set the type to User', () => {
			const userId = new ObjectId().toHexString();

			const context = new UserBoardContext(userId);

			expect(context.type).toBe(BoardExternalReferenceType.User);
		});
	});

	describe('getUsersWithBoardRoles', () => {
		it('should return the user with EDITOR and ADMIN roles', () => {
			const userId = new ObjectId().toHexString();

			const context = new UserBoardContext(userId);
			const result = context.getUsersWithBoardRoles();

			expect(result).toEqual([
				{
					userId,
					roles: [BoardRoles.EDITOR, BoardRoles.ADMIN],
				},
			]);
		});
	});

	describe('getBoardConfiguration', () => {
		it('should return canEditorsManageVideoconference as false', () => {
			const userId = new ObjectId().toHexString();
			const columnBoard = columnBoardFactory.build();

			const context = new UserBoardContext(userId);
			const result = context.getBoardConfiguration(columnBoard);

			expect(result.canEditorsManageVideoconference).toBe(false);
		});

		it('should return canReadersEdit as false', () => {
			const userId = new ObjectId().toHexString();
			const columnBoard = columnBoardFactory.build();

			const context = new UserBoardContext(userId);
			const result = context.getBoardConfiguration(columnBoard);

			expect(result.canReadersEdit).toBe(false);
		});

		it('should return canAdminsToggleReadersCanEdit as false', () => {
			const userId = new ObjectId().toHexString();
			const columnBoard = columnBoardFactory.build();

			const context = new UserBoardContext(userId);
			const result = context.getBoardConfiguration(columnBoard);

			expect(result.canAdminsToggleReadersCanEdit).toBe(false);
		});

		it('should return isLocked as false', () => {
			const userId = new ObjectId().toHexString();
			const columnBoard = columnBoardFactory.build();

			const context = new UserBoardContext(userId);
			const result = context.getBoardConfiguration(columnBoard);

			expect(result.isLocked).toBe(false);
		});

		it('should return the same configuration for MediaBoard', () => {
			const userId = new ObjectId().toHexString();
			const mediaBoard = mediaBoardFactory.build();

			const context = new UserBoardContext(userId);
			const result = context.getBoardConfiguration(mediaBoard);

			expect(result).toEqual({
				canEditorsManageVideoconference: false,
				canReadersEdit: false,
				canAdminsToggleReadersCanEdit: false,
				isLocked: false,
			});
		});
	});
});
