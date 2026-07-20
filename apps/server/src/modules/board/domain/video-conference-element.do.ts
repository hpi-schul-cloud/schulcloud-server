import { BoardNode } from './board-node.do';
import type { VideoConferenceElementProps } from './types/board-node-props';

export class VideoConferenceElement extends BoardNode<VideoConferenceElementProps> {
	get title(): string {
		return this.props.title;
	}

	set title(value: string) {
		this.props.title = value;
	}

	public canHaveChild(): boolean {
		return false;
	}
}

export const isVideoConferenceElement = (reference: unknown): reference is VideoConferenceElement =>
	reference instanceof VideoConferenceElement;
