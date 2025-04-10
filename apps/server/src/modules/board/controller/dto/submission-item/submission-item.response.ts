import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { FileElementResponse, RichTextElementResponse } from '../element';
import { TimestampsResponse } from '../timestamps.response';

@ApiExtraModels(FileElementResponse, RichTextElementResponse)
export class SubmissionItemResponse {
	constructor({ id, timestamps, completed, userId, elements }: SubmissionItemResponse) {
		this.id = id;
		this.timestamps = timestamps;
		this.completed = completed;
		this.userId = userId;
		this.elements = elements;
	}

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	public id: string;

	@ApiProperty()
	public timestamps: TimestampsResponse;

	@ApiProperty()
	public completed: boolean;

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	public userId: string;

	@ApiProperty({
		type: 'array',
		items: {
			oneOf: [{ $ref: getSchemaPath(FileElementResponse) }, { $ref: getSchemaPath(RichTextElementResponse) }],
		},
	})
	public elements: (RichTextElementResponse | FileElementResponse)[];
}
