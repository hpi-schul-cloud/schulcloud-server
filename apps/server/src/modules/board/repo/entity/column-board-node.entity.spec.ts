import { columnBoardNodeFactory, setupEntities } from '@shared/testing';
import { ColumnBoardNode } from './column-board-node.entity';

describe(ColumnBoardNode.name, () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('publish', () => {
		it('should set isVisible to true', () => {
			const columnBoard = columnBoardNodeFactory.build();
			columnBoard.publish();
			expect(columnBoard.isVisible).toBe(true);
		});
	});
	describe('unpublish', () => {
		it('should set isVisible to false', () => {
			const columnBoard = columnBoardNodeFactory.build();
			columnBoard.unpublish();
			expect(columnBoard.isVisible).toBe(false);
		});
	});
});
