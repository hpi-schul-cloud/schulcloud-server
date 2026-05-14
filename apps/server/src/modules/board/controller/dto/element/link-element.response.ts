import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { bsonStringPattern } from '@shared/controller/bson-string-pattern';
import { ContentElementType } from '../../../domain';
import { TimestampsResponse } from '../timestamps.response';

export class LinkElementContent {
	constructor({ url, title, description, originalImageUrl, imageUrl, previewImageId }: LinkElementContent) {
		this.url = url;
		this.title = title;
		this.description = description;
		this.originalImageUrl = originalImageUrl;
		this.imageUrl = imageUrl;
		this.previewImageId = previewImageId;
	}

	@ApiProperty()
	public url: string;

	@ApiProperty()
	public title: string;

	@ApiPropertyOptional()
	public description?: string;

	@ApiPropertyOptional()
	public originalImageUrl?: string;

	@ApiPropertyOptional()
	public imageUrl?: string;

	@ApiPropertyOptional()
	public previewImageId?: string;
}

export class LinkElementResponse {
	constructor({ id, content, timestamps, type }: LinkElementResponse) {
		this.id = id;
		this.content = content;
		this.timestamps = timestamps;
		this.type = type;
	}

	@ApiProperty({ pattern: bsonStringPattern })
	public id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	public type: ContentElementType.LINK;

	@ApiProperty()
	public content: LinkElementContent;

	@ApiProperty()
	public timestamps: TimestampsResponse;
}
