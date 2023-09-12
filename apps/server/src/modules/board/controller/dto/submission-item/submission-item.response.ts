import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { FileElementResponse, RichTextElementResponse } from '@src/modules/board/controller/dto';
import { TimestampsResponse } from '../timestamps.response';
import { UserDataResponse } from '../user-data.response';

export class SubmissionItemResponse {
	constructor({ id, timestamps, completed, userData, elements }: SubmissionItemResponse) {
		this.id = id;
		this.timestamps = timestamps;
		this.completed = completed;
		this.userData = userData;
		this.elements = elements;
	}

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty()
	timestamps: TimestampsResponse;

	@ApiProperty()
	completed: boolean;

	@ApiProperty()
	userData: UserDataResponse;

	@ApiProperty({
		type: 'array',
		// TODO add types
	})
	elements: (RichTextElementResponse | FileElementResponse)[];
}
