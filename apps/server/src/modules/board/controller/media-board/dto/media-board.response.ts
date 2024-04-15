import { ApiProperty } from '@nestjs/swagger';
import { TimestampsResponse } from '../../dto';
import { MediaLineResponse } from './media-line.response';

export class MediaBoardResponse {
	@ApiProperty()
	id: string;

	@ApiProperty({
		type: [MediaLineResponse],
	})
	lines: MediaLineResponse[];

	@ApiProperty()
	timestamps: TimestampsResponse;

	constructor(props: MediaBoardResponse) {
		this.id = props.id;
		this.lines = props.lines;
		this.timestamps = props.timestamps;
	}
}
