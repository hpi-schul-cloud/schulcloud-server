import { ApiProperty } from '@nestjs/swagger';
import { MediaBoardColors } from '../../../domain';
import { MediaAvailableLineElementResponse } from './media-available-line-element.response';

export class MediaAvailableLineResponse {
	@ApiProperty({
		type: [MediaAvailableLineElementResponse],
		description: 'Available media elements in the line',
	})
	elements: MediaAvailableLineElementResponse[];

	@ApiProperty({
		enum: MediaBoardColors,
		enumName: 'MediaBoardColors',
		description: 'Background color of available media line',
	})
	backgroundColor: MediaBoardColors;

	@ApiProperty({
		description: 'Collapse available media line',
	})
	collapsed: boolean;

	constructor(props: MediaAvailableLineResponse) {
		this.elements = props.elements;
		this.backgroundColor = props.backgroundColor;
		this.collapsed = props.collapsed;
	}
}
