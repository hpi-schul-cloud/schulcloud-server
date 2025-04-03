import { BoardNode } from './board-node.do';
import type { AudioRecordElementProps } from './types';

export class AudioRecordElement extends BoardNode<AudioRecordElementProps> {
	get alternativeText(): string {
		return this.props.alternativeText || '';
	}

	set alternativeText(value: string) {
		this.props.alternativeText = value;
	}

	get caption(): string {
		return this.props.caption || '';
	}

	set caption(value: string) {
		this.props.caption = value;
	}

	public canHaveChild(): boolean {
		return false;
	}
}

export const isAudioRecordElement = (reference: unknown): reference is AudioRecordElement =>
	reference instanceof AudioRecordElement;
