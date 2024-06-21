import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNodeEntityFactory, PropsWithType } from './board-node-entity.factory';
import { BoardNodeType, CollaborativeTextEditorElementProps, ROOT_PATH } from '../../domain';

export const collaborativeTextEditorEntityFactory = BoardNodeEntityFactory.define<
	PropsWithType<CollaborativeTextEditorElementProps>
>(() => {
	const props: PropsWithType<CollaborativeTextEditorElementProps> = {
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		position: 0,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		type: BoardNodeType.COLLABORATIVE_TEXT_EDITOR,
	};
	return props;
});
