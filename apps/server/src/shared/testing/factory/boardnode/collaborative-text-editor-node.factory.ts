import { BoardNodeProps } from '@shared/domain/entity';
import { CollaborativeTextEditorElementNode } from '@shared/domain/entity/boardnode/collaborative-text-editor-element-node.entity';
import { BaseFactory } from '../base.factory';

export const collaborativeTextEditorNodeFactory = BaseFactory.define<
	CollaborativeTextEditorElementNode,
	BoardNodeProps
>(CollaborativeTextEditorElementNode, () => {
	return {};
});
