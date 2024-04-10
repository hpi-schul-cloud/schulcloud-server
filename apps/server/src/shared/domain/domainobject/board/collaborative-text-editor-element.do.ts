import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import type { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

export class CollaborativeTextEditorElement extends BoardComposite<CollaborativeTextEditorElementProps> {
	get editorId(): string {
		return this.props.editorId;
	}

	set editorId(value: string) {
		this.props.editorId = value;
	}

	isAllowedAsChild(): boolean {
		return true;
	}

	accept(visitor: BoardCompositeVisitor): void {
		visitor.visitCollaborativeTextEditorElement(this);
	}

	async acceptAsync(visitor: BoardCompositeVisitorAsync): Promise<void> {
		await visitor.visitCollaborativeTextEditorElementAsync(this);
	}
}

export interface CollaborativeTextEditorElementProps extends BoardCompositeProps {
	editorId: string;
}

export function isCollaborativeTextEditorElement(reference: unknown): reference is CollaborativeTextEditorElement {
	return reference instanceof CollaborativeTextEditorElement;
}
