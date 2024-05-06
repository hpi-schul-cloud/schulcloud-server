import { BoardNode } from './board-node.do';
import type { CollaborativeTextEditorElementProps } from './types';

export class CollaborativeTextEditorElement extends BoardNode<CollaborativeTextEditorElementProps> {
	canHaveChild(): boolean {
		return false;
	}
}

export const isCollaborativeTextEditorElement = (reference: unknown): reference is CollaborativeTextEditorElement =>
	reference instanceof CollaborativeTextEditorElement;
