import { BoardNode } from '../board-node.do';
import type { MediaLineProps } from '../types/board-node-props';
import type { Colors } from '../types/colors.enum';
import { type AnyMediaBoardNode, isAnyMediaElement } from './types/any-media-board-node';

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
		const allowed: boolean = isAnyMediaElement(childNode);

		return allowed;
	}
}

// export type MediaLineInitProps = Omit<MediaLineProps, keyof BoardCompositeProps>;

export const isMediaLine = (reference: unknown): reference is MediaLine => reference instanceof MediaLine;
