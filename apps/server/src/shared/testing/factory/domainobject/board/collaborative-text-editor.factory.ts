import { ObjectId } from '@mikro-orm/mongodb';
import { CollaborativeTextEditorElement, CollaborativeTextEditorElementProps, ROOT_PATH } from '@modules/board/domain';
import { BaseFactory } from '../../base.factory';

export const collaborativeTextEditorFactory = BaseFactory.define<
	CollaborativeTextEditorElement,
	CollaborativeTextEditorElementProps
>(CollaborativeTextEditorElement, () => {
	return {
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		position: 0,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
