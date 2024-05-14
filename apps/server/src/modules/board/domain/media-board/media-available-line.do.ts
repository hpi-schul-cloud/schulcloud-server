import { MediaAvailableLineElement } from './media-available-line-element.do';
// TODO
export class MediaAvailableLine {
	elements: MediaAvailableLineElement[];

	constructor(props: MediaAvailableLineProps) {
		this.elements = props.elements;
	}
}

export interface MediaAvailableLineProps {
	elements: MediaAvailableLineElement[];
}
