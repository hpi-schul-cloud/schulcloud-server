import { ApiProperty } from '@nestjs/swagger';
import { MediaAvailableLineElementResponse } from './media-available-line-element.response';

export class MediaAvailableLineResponse {
	@ApiProperty({
		type: [MediaAvailableLineElementResponse],
		description: 'Available media elements in the line',
	})
	elements: MediaAvailableLineElementResponse[];

	@ApiProperty({
		description: 'Background color of available media line',
	})
	backgroundColor: string;

	constructor(props: MediaAvailableLineResponse) {
		this.elements = props.elements;
		this.backgroundColor = props.backgroundColor;
	}
}
