import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import type { BoardCompositeVisitor, BoardCompositeVisitorAsync } from './types';

export class LinkElement extends BoardComposite<LinkElementProps> {
	get url(): string {
		return this.props.url ?? '';
	}

	set url(value: string) {
		this.props.url = value;
	}

	get title(): string {
		return this.props.title ?? '';
	}

	set title(value: string) {
		this.props.title = value;
	}

	get description(): string {
		return this.props.description ?? '';
	}

	set description(value: string) {
		this.props.description = value ?? '';
	}

	get imageUrl(): string {
		return this.props.imageUrl ?? '';
	}

	set imageUrl(value: string) {
		this.props.imageUrl = value;
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
	title: string;
	description?: string;
	imageUrl?: string;
}

export function isLinkElement(reference: unknown): reference is LinkElement {
	return reference instanceof LinkElement;
}
