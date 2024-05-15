import { MediaBoardLayoutType } from '@modules/board/controller/media-board/types/layout-type.enum';
import { BoardComposite, BoardCompositeProps } from '../board-composite.do';
import type { AnyBoardDo, BoardCompositeVisitor, BoardCompositeVisitorAsync, BoardExternalReference } from '../types';
import { MediaLine } from './media-line.do';

export class MediaBoard extends BoardComposite<MediaBoardProps> {
	get context(): BoardExternalReference {
		return this.props.context;
	}

	get layout(): MediaBoardLayoutType {
		return this.props.layout;
	}

	set layout(layout: MediaBoardLayoutType) {
		this.props.layout = layout;
	}

	get mediaAvailableLineBackgroundColor(): string {
		return this.props.mediaAvailableLineBackgroundColor;
	}

	set mediaAvailableLineBackgroundColor(mediaAvailableLineBackgroundColor: string) {
		this.props.mediaAvailableLineBackgroundColor = mediaAvailableLineBackgroundColor;
	}

	get mediaAvailableLineCollapsed(): boolean {
		return this.props.mediaAvailableLineCollapsed;
	}

	set mediaAvailableLineCollapsed(collapsed: boolean) {
		this.props.mediaAvailableLineCollapsed = collapsed;
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
	layout: MediaBoardLayoutType;
	mediaAvailableLineBackgroundColor: string;
	mediaAvailableLineCollapsed: boolean;
}
