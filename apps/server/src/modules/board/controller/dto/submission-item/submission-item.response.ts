import { ApiProperty } from '@nestjs/swagger';
import { InputFormat, RichTextElementProps } from '@shared/domain';
import { TimestampsResponse } from '../timestamps.response';

export class SubmissionItemResponse {
	constructor({ id, timestamps, completed, userId, description, caption }: SubmissionItemResponse) {
		this.id = id;
		this.timestamps = timestamps;
		this.completed = completed;
		this.userId = userId;
		this.description = description;
		this.caption = caption;
	}

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty()
	timestamps: TimestampsResponse;

	@ApiProperty()
	completed: boolean;

	@ApiProperty()
	userId: string;

	description: {
		text: string;
		inputFormat: InputFormat;
	};

	caption: string;
}
