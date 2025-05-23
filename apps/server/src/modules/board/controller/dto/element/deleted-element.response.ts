import { ApiProperty } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
import { ContentElementType } from '../../../domain';
import { TimestampsResponse } from '../timestamps.response';

export class DeletedElementContent {
	constructor(props: DeletedElementContent) {
		this.title = props.title;
		this.description = props.description;
		this.deletedElementType = props.deletedElementType;
	}

	@ApiProperty()
	title: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	deletedElementType: ContentElementType;

	@ApiProperty()
	description?: string;
}

export class DeletedElementResponse {
	constructor(props: DeletedElementResponse) {
		this.id = props.id;
		this.type = props.type;
		this.content = props.content;
		this.timestamps = props.timestamps;
	}

	@ApiProperty({ pattern: bsonStringPattern })
	id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	type: ContentElementType.DELETED;

	@ApiProperty()
	content: DeletedElementContent;

	@ApiProperty()
	timestamps: TimestampsResponse;
}
