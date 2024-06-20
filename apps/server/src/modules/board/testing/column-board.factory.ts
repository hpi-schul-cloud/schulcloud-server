/* istanbul ignore file */
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { BoardExternalReferenceType, BoardLayout, ColumnBoard, ColumnBoardProps, ROOT_PATH } from '../domain';

class ColumnBoardFactory extends BaseFactory<ColumnBoard, ColumnBoardProps> {
	withoutContext(): this {
		const params = { context: undefined };
		return this.params(params);
	}
}

export const columnBoardFactory = ColumnBoardFactory.define(ColumnBoard, ({ sequence }) => {
	const props: ColumnBoardProps = {
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		title: `column board #${sequence}`,
		position: 0,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		context: {
			type: BoardExternalReferenceType.Course,
			id: new ObjectId().toHexString(),
		},
		isVisible: true,
		layout: BoardLayout.COLUMNS,
	};

	return props;
});
