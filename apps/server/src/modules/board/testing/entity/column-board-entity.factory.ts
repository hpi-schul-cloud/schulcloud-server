/* istanbul ignore file */
import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNodeEntityFactory, PropsWithType } from './board-node-entity.factory';
import { BoardExternalReferenceType, BoardLayout, BoardNodeType, ColumnBoardProps, ROOT_PATH } from '../../domain';

class ColumnBoardEntityFactory extends BoardNodeEntityFactory<PropsWithType<ColumnBoardProps>> {
	withoutContext(): this {
		const params = { context: undefined };
		return this.params(params);
	}
}

export const columnBoardEntityFactory = ColumnBoardEntityFactory.define(({ sequence }) => {
	const props: PropsWithType<ColumnBoardProps> = {
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
		type: BoardNodeType.COLUMN_BOARD,
	};

	return props;
});
