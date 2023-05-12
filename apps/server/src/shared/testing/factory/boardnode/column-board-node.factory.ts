/* istanbul ignore file */
import { BoardExternalReferenceType, ColumnBoardNode, ColumnBoardNodeProps } from '@shared/domain';
import { ObjectId } from 'bson';
import { BaseFactory } from '../base.factory';

export const columnBoardNodeFactory = BaseFactory.define<ColumnBoardNode, ColumnBoardNodeProps>(
	ColumnBoardNode,
	({ sequence }) => {
		return {
			context: {
				type: BoardExternalReferenceType.Course,
				id: new ObjectId().toHexString(),
			},
		};
	}
);
