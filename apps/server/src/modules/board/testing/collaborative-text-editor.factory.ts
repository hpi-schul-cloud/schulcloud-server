import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing/factory';
import { CollaborativeTextEditorElement, CollaborativeTextEditorElementProps, ROOT_PATH } from '../domain';

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
