import { ApiProperty } from '@nestjs/swagger';
import { TimestampsResponse } from '../../dto';
import { MediaBoardLayoutType } from '../types/layout-type.enum';
import { MediaLineResponse } from './media-line.response';

export class MediaBoardResponse {
	@ApiProperty({ description: 'The id of the media board' })
	id: string;

	@ApiProperty({
		type: [MediaLineResponse],
		description: 'The lines of the media board',
	})
	lines: MediaLineResponse[];

	@ApiProperty({ description: 'The timestamps of the media board' })
	timestamps: TimestampsResponse;

	@ApiProperty({
		description: 'Layout of media board',
	})
	layout: MediaBoardLayoutType;

	constructor(props: MediaBoardResponse) {
		this.id = props.id;
		this.lines = props.lines;
		this.timestamps = props.timestamps;
		this.layout = props.layout;
	}
}
