/* istanbul ignore file */
import { ColumnBoard, ColumnBoardProps } from '@shared/domain';
import { ObjectId } from 'bson';
import { BaseFactory } from '../../base.factory';

export const columnBoardFactory = BaseFactory.define<ColumnBoard, ColumnBoardProps>(ColumnBoard, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		title: `column board #${sequence}`,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
