import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import type { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

export class CollaborativeTextEditorElement extends BoardComposite<BoardCompositeProps> {
	isAllowedAsChild(): boolean {
		return false;
	}

	accept(visitor: BoardCompositeVisitor): void {
		visitor.visitCollaborativeTextEditorElement(this);
	}

	async acceptAsync(visitor: BoardCompositeVisitorAsync): Promise<void> {
		await visitor.visitCollaborativeTextEditorElementAsync(this);
	}
}

export function isCollaborativeTextEditorElement(reference: unknown): reference is CollaborativeTextEditorElement {
	return reference instanceof CollaborativeTextEditorElement;
}
