import { columnBoardNodeFactory, setupEntities } from '@shared/testing';
import { ColumnBoardNode } from './column-board-node.entity';

describe(ColumnBoardNode.name, () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('publish', () => {
		it('should set isVisible to true', () => {
			const column = columnBoardNodeFactory.build();
			column.publish();
			expect(column.isVisible).toBe(true);
		});
	});
	describe('unpublish', () => {
		it('should set isVisible to false', () => {
			const column = columnBoardNodeFactory.build();
			column.unpublish();
			expect(column.isVisible).toBe(false);
		});
	});
});
