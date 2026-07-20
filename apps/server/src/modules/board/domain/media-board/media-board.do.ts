import { BoardNode } from '../board-node.do';
import type { BoardExternalReference } from '../types/board-external-reference';
import type { BoardLayout } from '../types/board-layout.enum';
import type { MediaBoardProps } from '../types/board-node-props';
import type { Colors } from '../types/colors.enum';
import { MediaLine } from './media-line.do';
import type { AnyMediaBoardNode } from './types/any-media-board-node';

export class MediaBoard extends BoardNode<MediaBoardProps> {
	get context(): BoardExternalReference {
		return this.props.context;
	}

	set layout(layout: BoardLayout) {
		this.props.layout = layout;
	}

	get layout(): BoardLayout {
		return this.props.layout;
	}

	get backgroundColor(): Colors {
		return this.props.backgroundColor;
	}

	set backgroundColor(backgroundColor: Colors) {
		this.props.backgroundColor = backgroundColor;
	}

	get collapsed(): boolean {
		return this.props.collapsed;
	}

	set collapsed(collapsed: boolean) {
		this.props.collapsed = collapsed;
	}

	public canHaveChild(childNode: AnyMediaBoardNode): boolean {
		const allowed: boolean = childNode instanceof MediaLine;

		return allowed;
	}
}

export const isMediaBoard = (reference: unknown): reference is MediaBoard => reference instanceof MediaBoard;
