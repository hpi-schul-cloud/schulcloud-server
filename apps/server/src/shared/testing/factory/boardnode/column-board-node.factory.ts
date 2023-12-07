/* istanbul ignore file */
import { BoardExternalReferenceType } from '@shared/domain/domainobject/board/types/board-external-reference';
import { ColumnBoardNode, ColumnBoardNodeProps } from '@shared/domain/entity';
import { ObjectId } from 'bson';
import { BaseFactory } from '../base.factory';

export const columnBoardNodeFactory = BaseFactory.define<ColumnBoardNode, ColumnBoardNodeProps>(
	ColumnBoardNode,
	({ sequence }) => {
		return {
			title: `columnBoard #${sequence}`,
			context: {
				type: BoardExternalReferenceType.Course,
				id: new ObjectId().toHexString(),
			},
		};
	}
);
