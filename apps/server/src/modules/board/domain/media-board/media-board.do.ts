import type { BoardExternalReference, MediaBoardProps } from '../types';
import type { AnyMediaBoardNode } from './types/any-media-board-node';
import { MediaLine } from './media-line.do';
import { BoardNode } from '../board-node.do';

export class MediaBoard extends BoardNode<MediaBoardProps> {
	get context(): BoardExternalReference {
		return this.props.context;
	}

	canHaveChild(childNode: AnyMediaBoardNode): boolean {
		const allowed: boolean = childNode instanceof MediaLine;

		return allowed;
	}
}

export const isMediaBoard = (reference: unknown): reference is MediaBoard => reference instanceof MediaBoard;
