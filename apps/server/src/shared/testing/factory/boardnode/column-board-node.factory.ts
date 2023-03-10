import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNodeType, ColumnBoardNode, ColumnBoardNodeProps } from '@shared/domain';
import { BaseFactory } from '../base.factory';

export const columnBoardNodeFactory = BaseFactory.define<ColumnBoardNode, ColumnBoardNodeProps>(
	ColumnBoardNode,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			type: BoardNodeType.COLUMN_BOARD,
			title: `board #${sequence}`,
		};
	}
);
