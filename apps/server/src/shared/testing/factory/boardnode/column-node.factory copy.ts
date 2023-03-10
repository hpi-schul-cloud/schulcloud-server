import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNodeType, ColumnNode, ColumnNodeProps } from '@shared/domain';
import { BaseFactory } from '../base.factory';

export const columnNodeFactory = BaseFactory.define<ColumnNode, ColumnNodeProps>(ColumnNode, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		type: BoardNodeType.COLUMN,
		title: `column #${sequence}`,
	};
});
