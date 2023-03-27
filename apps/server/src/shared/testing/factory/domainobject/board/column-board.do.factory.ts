/* istanbul ignore file */
import { ColumnBoard, BoardCompositeProps } from '@shared/domain';
import { ObjectId } from 'bson';
import { BaseFactory } from '../../base.factory';

export const columnBoardFactory = BaseFactory.define<ColumnBoard, BoardCompositeProps>(ColumnBoard, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		title: `column board #${sequence}`,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
