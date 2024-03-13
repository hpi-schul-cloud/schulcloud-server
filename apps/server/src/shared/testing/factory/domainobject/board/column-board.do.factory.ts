/* istanbul ignore file */
import { ColumnBoard, ColumnBoardProps } from '@shared/domain/domainobject';
import { BoardExternalReferenceType } from '@shared/domain/domainobject/board/types';
import { ObjectId } from 'bson';
import { BaseFactory } from '../../base.factory';

export type IColumnBoardProperties = Readonly<ColumnBoardProps>;

class ColumnBoardFactory extends BaseFactory<ColumnBoard, ColumnBoardProps> {
	withoutContext(): this {
		const params = { context: undefined };
		return this.params(params);
	}
}
export const columnBoardFactory = ColumnBoardFactory.define(ColumnBoard, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		title: `column board #${sequence}`,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		context: {
			type: BoardExternalReferenceType.Course,
			id: new ObjectId().toHexString(),
		},
		isVisible: true,
	};
});
