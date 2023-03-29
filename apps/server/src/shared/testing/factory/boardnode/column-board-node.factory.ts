/* istanbul ignore file */
import { BoardNodeProps, ColumnBoardNode } from '@shared/domain';
import { BaseFactory } from '../base.factory';

export const columnBoardNodeFactory = BaseFactory.define<ColumnBoardNode, BoardNodeProps>(
	ColumnBoardNode,
	({ sequence }) => {
		return {
			title: `board #${sequence}`,
		};
	}
);
