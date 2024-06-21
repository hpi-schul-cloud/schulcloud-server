import { columnBoardNodeFactory } from '@shared/testing';
import { ColumnBoardNode } from './column-board-node.entity';

describe(ColumnBoardNode.name, () => {
	it('should be able to be published', () => {
		const nodeEntity = columnBoardNodeFactory.build({ isVisible: false });

		nodeEntity.publish();

		expect(nodeEntity.isVisible).toBe(true);
	});

	it('should be able to be unpublished', () => {
		const nodeEntity = columnBoardNodeFactory.build({ isVisible: true });

		nodeEntity.unpublish();

		expect(nodeEntity.isVisible).toBe(false);
	});
});
