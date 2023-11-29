import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import type { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

export class DrawingElement extends BoardComposite<DrawingElementProps> {
	get description(): string {
		return this.props.description;
	}

	set description(value: string) {
		this.props.description = value;
	}

	isAllowedAsChild(): boolean {
		return false;
	}

	accept(visitor: BoardCompositeVisitor): void {
		visitor.visitDrawingElement(this);
	}

	async acceptAsync(visitor: BoardCompositeVisitorAsync): Promise<void> {
		await visitor.visitDrawingElementAsync(this);
	}
}

export interface DrawingElementProps extends BoardCompositeProps {
	description: string;
}

export function isDrawingElement(reference: unknown): reference is DrawingElement {
	return reference instanceof DrawingElement;
}
