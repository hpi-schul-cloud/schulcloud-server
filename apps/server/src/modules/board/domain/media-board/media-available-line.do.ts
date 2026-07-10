import { type Colors } from './types';
import { type MediaAvailableLineElement } from './media-available-line-element.do';
// TODO
export class MediaAvailableLine {
	public elements: MediaAvailableLineElement[];

	public backgroundColor: Colors;

	public collapsed: boolean;

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
