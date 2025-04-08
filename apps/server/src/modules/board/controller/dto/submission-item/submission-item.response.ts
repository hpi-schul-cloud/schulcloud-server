import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
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

	@ApiProperty({ pattern: bsonStringPattern })
	id: string;

	@ApiProperty()
	timestamps: TimestampsResponse;

	@ApiProperty()
	completed: boolean;

	@ApiProperty({ pattern: bsonStringPattern })
	userId: string;

	@ApiProperty({
		type: 'array',
		items: {
			oneOf: [{ $ref: getSchemaPath(FileElementResponse) }, { $ref: getSchemaPath(RichTextElementResponse) }],
		},
	})
	elements: (RichTextElementResponse | FileElementResponse)[];
}
