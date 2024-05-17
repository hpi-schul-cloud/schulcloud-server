/* istanbul ignore file */
import { ObjectId } from '@mikro-orm/mongodb';
import { ColumnBoardNode, ColumnBoardNodeProps } from '@shared/domain/entity';
import { BoardExternalReferenceType } from '@src/modules/board';
import { BoardLayout } from '@src/modules/board/domain/types/board-layout.enum';
import { BaseFactory } from './base.factory';

export const columnBoardNodeFactory = BaseFactory.define<ColumnBoardNode, ColumnBoardNodeProps>(
	ColumnBoardNode,
	({ sequence }) => {
		return {
			title: `columnBoard #${sequence}`,
			isVisible: true,
			layout: BoardLayout.COLUMNS,
			context: {
				type: BoardExternalReferenceType.Course,
				id: new ObjectId().toHexString(),
			},
		};
	}
);
