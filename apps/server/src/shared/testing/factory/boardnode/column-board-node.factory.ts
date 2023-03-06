import { ColumnBoardNode, ColumnBoardNodeProperties } from '@shared/domain';
import { BaseFactory } from '../base.factory';

export const columnBoardNodeFactory = BaseFactory.define<ColumnBoardNode, ColumnBoardNodeProperties>(
	ColumnBoardNode,
	({ sequence }) => {
		return {
			title: `board #${sequence}`,
		};
	}
);
