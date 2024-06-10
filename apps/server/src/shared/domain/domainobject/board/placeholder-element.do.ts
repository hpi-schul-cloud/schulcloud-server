import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import type { BoardCompositeVisitor, BoardCompositeVisitorAsync, ContentElementType } from './types';

export class PlaceholderElement extends BoardComposite<PlaceholderElementProps> {
	get previousElementType(): ContentElementType {
		return this.props.previousElementType;
	}

	set previousElementType(value: ContentElementType) {
		this.props.previousElementType = value;
	}

	get previousElementDisplayName(): string {
		return this.props.previousElementDisplayName;
	}

	set previousElementDisplayName(value: string) {
		this.props.previousElementDisplayName = value;
	}

	isAllowedAsChild(): boolean {
		return false;
	}

	accept(visitor: BoardCompositeVisitor): void {
		visitor.visitPlaceholderElement(this);
	}

	async acceptAsync(visitor: BoardCompositeVisitorAsync): Promise<void> {
		await visitor.visitPlaceholderElementAsync(this);
	}
}

export interface PlaceholderElementProps extends BoardCompositeProps {
	previousElementType: ContentElementType;
	previousElementDisplayName: string;
}

export function isPlaceholderElement(reference: unknown): reference is PlaceholderElement {
	return reference instanceof PlaceholderElement;
}
