import { columnBoardTargetFactory, setupEntities } from '@shared/testing';
import { ObjectId } from 'bson';
import { ColumnBoardTarget } from './column-board-target.entity';

describe(ColumnBoardTarget.name, () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('publish', () => {
		it('should set the state to published', () => {
			const target = columnBoardTargetFactory.build();
			target.publish();
			expect(target.published).toBe(true);
		});
	});

	describe('unpublish', () => {
		it('should set the state to unpublished', () => {
			const target = columnBoardTargetFactory.build({ published: true });
			target.unpublish();
			expect(target.published).toBe(false);
		});
	});

	describe('getColumnBoardId', () => {
		it('should return the columnBoardId property', () => {
			const columnBoardId = new ObjectId().toHexString();
			const target = columnBoardTargetFactory.build({ columnBoardId });
			expect(target.columnBoardId).toEqual(columnBoardId);
		});
	});
});
