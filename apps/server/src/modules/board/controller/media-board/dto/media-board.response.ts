import { ApiProperty } from '@nestjs/swagger';
import { BoardLayout } from '../../../domain';
import { TimestampsResponse } from '../../dto';
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
		enum: BoardLayout,
		enumName: 'MediaBoardLayoutType',
		description: 'Layout of media board',
	})
	layout: BoardLayout;

	constructor(props: MediaBoardResponse) {
		this.id = props.id;
		this.lines = props.lines;
		this.timestamps = props.timestamps;
		this.layout = props.layout;
	}
}
