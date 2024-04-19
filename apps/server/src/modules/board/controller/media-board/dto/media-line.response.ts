import { ApiProperty } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
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

	constructor(props: MediaLineResponse) {
		this.id = props.id;
		this.title = props.title;
		this.elements = props.elements;
		this.timestamps = props.timestamps;
	}
}
