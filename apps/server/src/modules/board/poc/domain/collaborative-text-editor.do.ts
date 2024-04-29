import { BoardNode } from './board-node.do';
import type { CollaborativeTextEditorProps } from './types';

export class CollaborativeTextEditor extends BoardNode<CollaborativeTextEditorProps> {
	canHaveChild(): boolean {
		return false;
	}
}
