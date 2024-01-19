import { ApiProperty } from '@nestjs/swagger';
import { ContentElementType } from '@shared/domain/domainobject';
import { TimestampsResponse } from '../timestamps.response';

export class LearnstoreElementContent {
	constructor(props: LearnstoreElementContent) {
		this.someId = props.someId;
	}

	@ApiProperty({ type: String, required: true, nullable: true })
	someId: string | null;
}

export class LearnstoreElementResponse {
	constructor(props: LearnstoreElementResponse) {
		this.id = props.id;
		this.type = props.type;
		this.content = props.content;
		this.timestamps = props.timestamps;
	}

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	type: ContentElementType.LEARNSTORE;

	@ApiProperty()
	content: LearnstoreElementContent;

	@ApiProperty()
	timestamps: TimestampsResponse;
}
