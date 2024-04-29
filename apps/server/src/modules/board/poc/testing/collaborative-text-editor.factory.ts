import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { CollaborativeTextEditor, CollaborativeTextEditorProps, ROOT_PATH } from '../domain';

export const collaborativeTextEditorFactory = BaseFactory.define<CollaborativeTextEditor, CollaborativeTextEditorProps>(
	CollaborativeTextEditor,
	() => {
		return {
			id: new ObjectId().toHexString(),
			path: ROOT_PATH,
			level: 0,
			position: 0,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);
