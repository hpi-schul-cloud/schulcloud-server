/* istanbul ignore file */
import { BoardCompositeProps, CollaborativeTextEditorElement } from '@shared/domain/domainobject';
import { BaseFactory } from '../../base.factory';

export const collaborativeTextEditorElementFactory = BaseFactory.define<
	CollaborativeTextEditorElement,
	BoardCompositeProps
>(CollaborativeTextEditorElement, () => {
	return {
		id: 'collaborative-text-editor-element-id',
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});
