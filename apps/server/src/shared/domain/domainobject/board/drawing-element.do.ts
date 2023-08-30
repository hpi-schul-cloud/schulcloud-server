import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import type { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

export class DrawingElement extends BoardComposite<DrawingElementProps> {
	get drawingName(): string {
		return this.props.drawingName;
	}

	set drawingName(value: string) {
		this.props.drawingName = value;
	}

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
	drawingName: string;
	description: string;
}
