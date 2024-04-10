import { ApiProperty } from '@nestjs/swagger';
import { DecodeHtmlEntities } from '@shared/controller';
import { TimestampsResponse } from '../../dto';
import { MediaExternalToolElementResponse } from './media-external-tool-element.response';

export class MediaLineResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	@DecodeHtmlEntities()
	title: string;

	@ApiProperty({
		type: [MediaExternalToolElementResponse],
	})
	elements: MediaExternalToolElementResponse[];

	@ApiProperty()
	timestamps: TimestampsResponse;

	constructor(props: MediaLineResponse) {
		this.id = props.id;
		this.title = props.title;
		this.elements = props.elements;
		this.timestamps = props.timestamps;
	}
}
