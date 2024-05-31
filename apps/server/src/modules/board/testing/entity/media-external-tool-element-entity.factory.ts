import { ObjectId } from '@mikro-orm/mongodb';
import { contextExternalToolEntityFactory } from '@modules/tool/context-external-tool/testing';
import { BoardNodeType, MediaExternalToolElementProps, ROOT_PATH } from '../../domain';
import { BoardNodeEntityFactory, PropsWithType } from './board-node-entity.factory';

export const mediaExternalToolElementEntityFactory = BoardNodeEntityFactory.define<
	PropsWithType<MediaExternalToolElementProps>
>(() => {
	const contextExternalTool = contextExternalToolEntityFactory.build();

	const props: PropsWithType<MediaExternalToolElementProps> = {
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		position: 0,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		contextExternalToolId: contextExternalTool.id,
		type: BoardNodeType.MEDIA_EXTERNAL_TOOL_ELEMENT,
	};

	return props;
});
