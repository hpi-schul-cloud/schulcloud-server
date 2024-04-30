import { BoardNode } from './board-node.do';
import type { DrawingElementProps } from './types';

export class DrawingElement extends BoardNode<DrawingElementProps> {
	get description(): string {
		return this.props.description || '';
	}

	set description(value: string) {
		this.props.description = value;
	}

	canHaveChild(): boolean {
		return false;
	}
}

export const isDrawingElement = (reference: unknown): reference is DrawingElement =>
	reference instanceof DrawingElement;
