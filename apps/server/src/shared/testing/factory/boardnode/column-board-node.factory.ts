/* istanbul ignore file */
import { BoardExternalReferenceType } from '@shared/domain/domainobject/board/types';
import { ColumnBoardNode, ColumnBoardNodeProps } from '@shared/domain/entity';
import { ObjectId } from '@mikro-orm/mongodb';
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
			isVisible: true,
		};
	}
);
