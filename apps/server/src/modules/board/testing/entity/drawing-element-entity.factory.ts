import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNodeEntityFactory, PropsWithType } from './board-node-entity.factory';
import { BoardNodeType, DrawingElementProps, ROOT_PATH } from '../../domain';

export const drawingElementEntityFactory = BoardNodeEntityFactory.define<PropsWithType<DrawingElementProps>>(
	({ sequence }) => {
		const props: PropsWithType<DrawingElementProps> = {
			id: new ObjectId().toHexString(),
			path: ROOT_PATH,
			level: 0,
			position: 0,
			children: [],
			description: `caption #${sequence}`,
			createdAt: new Date(),
			updatedAt: new Date(),
			type: BoardNodeType.DRAWING_ELEMENT,
		};

		return props;
	}
);
