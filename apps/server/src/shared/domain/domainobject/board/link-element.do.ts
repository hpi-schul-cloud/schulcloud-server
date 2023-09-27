import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import type { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

export class LinkElement extends BoardComposite<LinkElementProps> {
	get url(): string {
		return this.props.url || '';
	}

	set url(value: string) {
		this.props.url = value;
	}

	isAllowedAsChild(): boolean {
		return false;
	}

	accept(visitor: BoardCompositeVisitor): void {
		visitor.visitLinkElement(this);
	}

	async acceptAsync(visitor: BoardCompositeVisitorAsync): Promise<void> {
		await visitor.visitLinkElementAsync(this);
	}
}

export interface LinkElementProps extends BoardCompositeProps {
	url: string;
}

export function isLinkElement(reference: unknown): reference is LinkElement {
	return reference instanceof LinkElement;
}
