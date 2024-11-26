import { BoardNode } from './board-node.do';
import type { VideoConferenceElementProps } from './types';

export class VideoConferenceElement extends BoardNode<VideoConferenceElementProps> {
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

	canHaveChild(): boolean {
		return false;
	}
}

export const isVideoConferenceElement = (reference: unknown): reference is VideoConferenceElement =>
	reference instanceof VideoConferenceElement;
