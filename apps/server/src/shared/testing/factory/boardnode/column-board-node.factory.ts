import { ColumnBoardNode, ColumnBoardNodeProps } from '@shared/domain';
import { BaseFactory } from '../base.factory';

export const columnBoardNodeFactory = BaseFactory.define<ColumnBoardNode, ColumnBoardNodeProps>(
	ColumnBoardNode,
	({ sequence }) => {
		return {
			title: `board #${sequence}`,
		};
	}
);
