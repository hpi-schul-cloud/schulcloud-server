import type { AnyMediaBoardNode, BoardExternalReference, MediaBoardProps } from '../types';
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
