import { DeletedElement } from '../deleted-element.do';
import { type AnyMediaBoardNode, type Colors } from './types';
import type { MediaLineProps } from '../types';
import { BoardNode } from '../board-node.do';
import { MediaExternalToolElement } from './media-external-tool-element.do';

export class MediaLine extends BoardNode<MediaLineProps> {
	get title(): string {
		return this.props.title;
	}

	set title(title: string) {
		this.props.title = title;
	}

	set backgroundColor(backgroundColor: Colors) {
		this.props.backgroundColor = backgroundColor;
	}

	get backgroundColor(): Colors {
		return this.props.backgroundColor;
	}

	set collapsed(collapsed: boolean) {
		this.props.collapsed = collapsed;
	}

	get collapsed(): boolean {
		return this.props.collapsed;
	}

	public canHaveChild(childNode: AnyMediaBoardNode): boolean {
		// Using direct instanceof checks to avoid circular dependency with guards/
		const allowed: boolean = childNode instanceof MediaExternalToolElement || childNode instanceof DeletedElement;

		return allowed;
	}
}

// export type MediaLineInitProps = Omit<MediaLineProps, keyof BoardCompositeProps>;

export const isMediaLine = (reference: unknown): reference is MediaLine => reference instanceof MediaLine;
