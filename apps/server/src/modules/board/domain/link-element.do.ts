import { BoardNode } from './board-node.do';
import type { LinkElementProps } from './types';

export class LinkElement extends BoardNode<LinkElementProps> {
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

	canHaveChild(): boolean {
		return false;
	}
}

export const isLinkElement = (reference: unknown): reference is LinkElement => reference instanceof LinkElement;
