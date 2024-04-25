/* istanbul ignore file */
import { ObjectId } from '@mikro-orm/mongodb';
import { BoardCompositeProps, CollaborativeTextEditorElement } from '@shared/domain/domainobject';
import { BaseFactory } from '../../base.factory';

export const collaborativeTextEditorElementFactory = BaseFactory.define<
	CollaborativeTextEditorElement,
	BoardCompositeProps
>(CollaborativeTextEditorElement, () => {
	return {
		id: new ObjectId().toHexString(),
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
