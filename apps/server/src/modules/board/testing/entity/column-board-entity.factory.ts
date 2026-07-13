/* istanbul ignore file */
import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNodeEntityFactory, type PropsWithType } from './board-node-entity.factory';
import { BoardExternalReferenceType, BoardLayout, BoardNodeType, type ColumnBoardProps, ROOT_PATH } from '../../domain';
import { Context } from '../../repo/entity/embeddables';

class ColumnBoardEntityFactory extends BoardNodeEntityFactory<PropsWithType<ColumnBoardProps>> {
	public withoutContext(): this {
		const params = { context: undefined };
		return this.params(params);
	}
}

export const columnBoardEntityFactory = ColumnBoardEntityFactory.define(({ sequence, params }) => {
	const context =
		params.context && params.context.type && params.context.id
			? new Context({
					type: params.context.type,
					id: params.context.id,
				})
			: new Context({
					type: BoardExternalReferenceType.Course,
					id: new ObjectId().toHexString(),
				});

	const props: PropsWithType<ColumnBoardProps> = {
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		title: `column board #${sequence}`,
		position: 0,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		context,
		isVisible: true,
		readersCanEdit: params.readersCanEdit ?? false,
		layout: BoardLayout.COLUMNS,
		type: BoardNodeType.COLUMN_BOARD,
	};

	return props;
});
