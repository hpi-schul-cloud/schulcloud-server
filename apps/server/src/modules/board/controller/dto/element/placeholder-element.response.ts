import { ApiProperty } from '@nestjs/swagger';
import { ContentElementType } from '@shared/domain/domainobject';
import { TimestampsResponse } from '../timestamps.response';

export class PlaceholderElementContent {
	constructor(props: PlaceholderElementContent) {
		this.title = props.title;
		this.deletedType = props.deletedType;
	}

	@ApiProperty()
	title: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	deletedType: ContentElementType;
}

export class PlaceholderElementResponse {
	constructor({ id, content, timestamps, type }: PlaceholderElementResponse) {
		this.id = id;
		this.content = content;
		this.timestamps = timestamps;
		this.type = type;
	}

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	type: ContentElementType.PLACEHOLDER;

	@ApiProperty()
	content: PlaceholderElementContent;

	@ApiProperty()
	timestamps: TimestampsResponse;
}
