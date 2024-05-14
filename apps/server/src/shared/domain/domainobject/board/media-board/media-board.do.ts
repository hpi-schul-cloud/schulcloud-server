import { BoardComposite, BoardCompositeProps } from '../board-composite.do';
import type { AnyBoardDo, BoardCompositeVisitor, BoardCompositeVisitorAsync, BoardExternalReference } from '../types';
import { MediaLine } from './media-line.do';

export class MediaBoard extends BoardComposite<MediaBoardProps> {
	get context(): BoardExternalReference {
		return this.props.context;
	}

	get mediaAvailableLineBackgroundColor(): string | undefined {
		return this.props.mediaAvailableLineBackgroundColor;
	}

	set mediaAvailableLineBackgroundColor(mediaAvailableLineBackgroundColor: string | undefined) {
		this.props.mediaAvailableLineBackgroundColor = mediaAvailableLineBackgroundColor;
	}

	isAllowedAsChild(domainObject: AnyBoardDo): boolean {
		const allowed: boolean = domainObject instanceof MediaLine;

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
	mediaAvailableLineBackgroundColor?: string;
}
