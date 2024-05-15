import { MediaAvailableLineElement } from './media-available-line-element.do';

export class MediaAvailableLine {
	elements: MediaAvailableLineElement[];

	backgroundColor: string;

	collapsed: boolean;

	constructor(props: MediaAvailableLineProps) {
		this.elements = props.elements;
		this.backgroundColor = props.backgroundColor;
		this.collapsed = props.collapsed;
	}
}

export interface MediaAvailableLineProps {
	elements: MediaAvailableLineElement[];
	backgroundColor: string;
	collapsed: boolean;
}
