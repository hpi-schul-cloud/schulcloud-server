import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNodeType, ColumnProps, ROOT_PATH } from '../../domain';
import { BoardNodeEntityFactory, PropsWithType } from './board-node-entity.factory';

export const columnEntityFactory = BoardNodeEntityFactory.define<PropsWithType<ColumnProps>>(({ sequence }) => {
	const props: PropsWithType<ColumnProps> = {
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		title: `column #${sequence}`,
		position: 0,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		type: BoardNodeType.COLUMN,
	};

	return props;
});
