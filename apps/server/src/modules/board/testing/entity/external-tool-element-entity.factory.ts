import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNodeEntityFactory, PropsWithType } from './board-node-entity.factory';
import { BoardNodeType, ExternalToolElementProps, ROOT_PATH } from '../../domain';

export const externalToolElementEntityFactory = BoardNodeEntityFactory.define<PropsWithType<ExternalToolElementProps>>(
	() => {
		const props: PropsWithType<ExternalToolElementProps> = {
			id: new ObjectId().toHexString(),
			path: ROOT_PATH,
			level: 0,
			position: 0,
			children: [],
			contextExternalToolId: new ObjectId().toHexString(), // TODO check if this should be undefined
			createdAt: new Date(),
			updatedAt: new Date(),
			type: BoardNodeType.EXTERNAL_TOOL,
		};

		return props;
	}
);
