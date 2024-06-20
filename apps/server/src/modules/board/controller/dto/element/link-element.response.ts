import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentElementType } from '../../../domain';
import { TimestampsResponse } from '../timestamps.response';

export class LinkElementContent {
	constructor({ url, title, description, imageUrl }: LinkElementContent) {
		this.url = url;
		this.title = title;
		this.description = description;
		this.imageUrl = imageUrl;
	}

	@ApiProperty()
	url: string;

	@ApiProperty()
	title: string;

	@ApiPropertyOptional()
	description?: string;

	@ApiPropertyOptional()
	imageUrl?: string;
}

export class LinkElementResponse {
	constructor({ id, content, timestamps, type }: LinkElementResponse) {
		this.id = id;
		this.content = content;
		this.timestamps = timestamps;
		this.type = type;
	}

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	type: ContentElementType.LINK;

	@ApiProperty()
	content: LinkElementContent;

	@ApiProperty()
	timestamps: TimestampsResponse;
}
