/* istanbul ignore file */
import { ObjectId } from '@mikro-orm/mongodb';
import { BoardExternalReferenceType, BoardLayout, BoardNodeType, ColumnBoardProps, ROOT_PATH } from '../../domain';
import { Context } from '../../repo/entity/embeddables';
import { BoardNodeEntityFactory, PropsWithType } from './board-node-entity.factory';

class ColumnBoardEntityFactory extends BoardNodeEntityFactory<PropsWithType<ColumnBoardProps>> {
	public withoutContext(): this {
		const params = { boardContext: undefined } as unknown as ColumnBoardProps;
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

	const props = {
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		title: `column board #${sequence}`,
		position: 0,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		boardContext: context,
		isVisible: true,
		readersCanEdit: false,
		layout: BoardLayout.COLUMNS,
		type: BoardNodeType.COLUMN_BOARD,
	} as unknown as PropsWithType<ColumnBoardProps>;

	return props;
});
