import { MediaAvailableLineElement } from './media-available-line-element.do';

export class MediaAvailableLine {
	elements: MediaAvailableLineElement[];

	constructor(props: MediaAvailableLineProps) {
		this.elements = props.elements;
	}

	addElement(element: MediaAvailableLineElement): void {
		this.elements.push(element);
	}
}

export interface MediaAvailableLineProps {
	elements: MediaAvailableLineElement[];
}
