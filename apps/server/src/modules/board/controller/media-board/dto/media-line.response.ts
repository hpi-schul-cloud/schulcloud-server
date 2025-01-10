import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { MediaBoardColors } from '../../../domain';
import { DeletedElementResponse, TimestampsResponse } from '../../dto';
import { AnyMediaElementResponse } from './any-media-element.response';
import { MediaExternalToolElementResponse } from './media-external-tool-element.response';

export class MediaLineResponse {
	@ApiProperty({ description: 'The id of the media line' })
	id: string;

	@ApiProperty({ description: 'The title of the media line' })
	@DecodeHtmlEntities()
	title: string;

	@ApiProperty({
		description: 'The elements of the media line',
		type: 'array',
		items: {
			oneOf: [
				{ $ref: getSchemaPath(MediaExternalToolElementResponse) },
				{ $ref: getSchemaPath(DeletedElementResponse) },
			],
		},
	})
	elements: AnyMediaElementResponse[];

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
