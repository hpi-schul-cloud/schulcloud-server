import { Colors } from './types';
import { MediaAvailableLineElement } from './media-available-line-element.do';
// TODO
export class MediaAvailableLine {
	elements: MediaAvailableLineElement[];

	backgroundColor: Colors;

	collapsed: boolean;

	constructor(props: MediaAvailableLineProps) {
		this.elements = props.elements;
		this.backgroundColor = props.backgroundColor;
		this.collapsed = props.collapsed;
	}
}

export interface MediaAvailableLineProps {
	elements: MediaAvailableLineElement[];
	backgroundColor: Colors;
	collapsed: boolean;
}
