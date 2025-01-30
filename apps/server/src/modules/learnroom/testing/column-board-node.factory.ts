/* istanbul ignore file */
import { ObjectId } from '@mikro-orm/mongodb';
import { BoardExternalReferenceType } from '@modules/board/domain/types/board-external-reference';
import { BoardLayout } from '@modules/board/domain/types/board-layout.enum';
import { ColumnBoardNode, ColumnBoardNodeProps } from '@modules/learnroom/repo';
import { BaseFactory } from '@testing/factory/base.factory';

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
