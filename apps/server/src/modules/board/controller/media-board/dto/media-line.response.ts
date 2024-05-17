import { ApiProperty } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { MediaBoardColors } from '../../../domain';
import { TimestampsResponse } from '../../dto';
import { MediaExternalToolElementResponse } from './media-external-tool-element.response';

export class MediaLineResponse {
	@ApiProperty({ description: 'The id of the media line' })
	id: string;

	@ApiProperty({ description: 'The title of the media line' })
	@DecodeHtmlEntities()
	title: string;

	@ApiProperty({
		type: [MediaExternalToolElementResponse],
		description: 'The elements of the media line',
	})
	elements: MediaExternalToolElementResponse[];

	@ApiProperty({ description: 'The timestamps of the media line' })
	timestamps: TimestampsResponse;

	@ApiProperty({
		enum: MediaBoardColors,
		enumName: 'MediaBoardColors',
		description: 'The background color of the media line',
	})
	backgroundColor: MediaBoardColors;

	@ApiProperty({ description: 'Collapse the media line' })
	collapsed: boolean;

	constructor(props: MediaLineResponse) {
		this.id = props.id;
		this.title = props.title;
		this.elements = props.elements;
		this.timestamps = props.timestamps;
		this.backgroundColor = props.backgroundColor;
		this.collapsed = props.collapsed;
	}
}
