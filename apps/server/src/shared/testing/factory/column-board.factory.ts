import { ColumnBoard, ColumnBoardProps } from '@shared/domain';
import { BaseFactory } from './base.factory';

export const columnBoardFactory = BaseFactory.define<ColumnBoard, ColumnBoardProps>(ColumnBoard, ({ sequence }) => {
	return {
		title: `board #${sequence}`,
		columns: [],
	};
});
