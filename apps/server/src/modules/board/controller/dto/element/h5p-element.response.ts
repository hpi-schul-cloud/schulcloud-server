import { ApiProperty } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
import { ContentElementType } from '../../../domain';
import { TimestampsResponse } from '../timestamps.response';

export class H5pElementContent {
	constructor(props: H5pElementContent) {
		this.contentId = props.contentId;
	}

	@ApiProperty({ type: String, required: true, nullable: true })
	public contentId: string | null;
}

export class H5pElementResponse {
	constructor(props: H5pElementResponse) {
		this.id = props.id;
		this.type = props.type;
		this.content = props.content;
		this.timestamps = props.timestamps;
	}

	@ApiProperty({ pattern: bsonStringPattern })
	public id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	public type: ContentElementType.H5P;

	@ApiProperty()
	public content: H5pElementContent;

	@ApiProperty()
	public timestamps: TimestampsResponse;
}
