import { AnyMediaBoardNode, isAnyMediaElement, MediaBoardColors } from './types';
import type { MediaLineProps } from '../types';
import { BoardNode } from '../board-node.do';

export class MediaLine extends BoardNode<MediaLineProps> {
	get title(): string {
		return this.props.title;
	}

	set title(title: string) {
		this.props.title = title;
	}

	set backgroundColor(backgroundColor: MediaBoardColors) {
		this.props.backgroundColor = backgroundColor;
	}

	get backgroundColor(): MediaBoardColors {
		return this.props.backgroundColor;
	}

	set collapsed(collapsed: boolean) {
		this.props.collapsed = collapsed;
	}

	get collapsed(): boolean {
		return this.props.collapsed;
	}

	canHaveChild(childNode: AnyMediaBoardNode): boolean {
		const allowed: boolean = isAnyMediaElement(childNode);

		return allowed;
	}
}

// export type MediaLineInitProps = Omit<MediaLineProps, keyof BoardCompositeProps>;

export const isMediaLine = (reference: unknown): reference is MediaLine => reference instanceof MediaLine;
