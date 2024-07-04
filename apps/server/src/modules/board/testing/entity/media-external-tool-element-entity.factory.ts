import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNodeType, MediaExternalToolElementProps, ROOT_PATH } from '../../domain';
import { BoardNodeEntityFactory, PropsWithType } from './board-node-entity.factory';

export const mediaExternalToolElementEntityFactory = BoardNodeEntityFactory.define<
	PropsWithType<MediaExternalToolElementProps>
>(() => {
	const props: PropsWithType<MediaExternalToolElementProps> = {
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		position: 0,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		contextExternalToolId: new ObjectId().toHexString(),
		type: BoardNodeType.MEDIA_EXTERNAL_TOOL_ELEMENT,
	};

	return props;
});
