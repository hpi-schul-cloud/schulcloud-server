import { BoardComposite, BoardCompositeProps } from '../board-composite.do';
import type { AnyBoardDo, BoardCompositeVisitor, BoardCompositeVisitorAsync, BoardExternalReference } from '../types';
import { MediaLine } from './media-line.do';

export class MediaBoard extends BoardComposite<MediaBoardProps> {
	get context(): BoardExternalReference {
		return this.props.context;
	}

	set context(context: BoardExternalReference) {
		this.props.context = context;
	}

	isAllowedAsChild(domainObject: AnyBoardDo): boolean {
		const allowed = domainObject instanceof MediaLine;
		return allowed;
	}

	accept(visitor: BoardCompositeVisitor): void {
		visitor.visitMediaBoard(this);
	}

	async acceptAsync(visitor: BoardCompositeVisitorAsync): Promise<void> {
		await visitor.visitMediaBoardAsync(this);
	}
}

export interface MediaBoardProps extends BoardCompositeProps {
	context: BoardExternalReference;
}

export function isMediaBoard(reference: unknown): reference is MediaBoard {
	return reference instanceof MediaBoard;
}
