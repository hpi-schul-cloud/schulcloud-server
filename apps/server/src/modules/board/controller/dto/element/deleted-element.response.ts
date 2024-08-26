import { ApiProperty } from '@nestjs/swagger';
import { ContentElementType } from '../../../domain';
import { TimestampsResponse } from '../timestamps.response';

export class DeletedElementContent {
	constructor(props: DeletedElementContent) {
		this.title = props.title;
		this.deletedElementType = props.deletedElementType;
	}

	@ApiProperty()
	title: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	deletedElementType: ContentElementType;
}

export class DeletedElementResponse {
	constructor(props: DeletedElementResponse) {
		this.id = props.id;
		this.type = props.type;
		this.content = props.content;
		this.timestamps = props.timestamps;
	}

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	type: ContentElementType.DELETED;

	@ApiProperty()
	content: DeletedElementContent;

	@ApiProperty()
	timestamps: TimestampsResponse;
}
