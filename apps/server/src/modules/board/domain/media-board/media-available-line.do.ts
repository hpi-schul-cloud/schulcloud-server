import type { Colors } from '../types/colors.enum';
import { type MediaAvailableLineElement } from './media-available-line-element.do';
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
