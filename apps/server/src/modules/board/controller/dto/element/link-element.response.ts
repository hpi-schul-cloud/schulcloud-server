import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentElementType } from '@shared/domain';
import { TimestampsResponse } from '../timestamps.response';

export class OpenGraphImageData {
	constructor({ url, type, width, height }: OpenGraphImageData) {
		this.url = url;
		this.type = type;
		this.width = width ? +width : undefined;
		this.height = height ? +height : undefined;
	}

	@ApiProperty()
	url: string;

	@ApiPropertyOptional()
	type?: string;

	@ApiPropertyOptional()
	width?: number;

	@ApiPropertyOptional()
	height?: number;
}

export class OpenGraphData {
	constructor({ title, description, image, url }: OpenGraphData) {
		this.title = title;
		this.description = description;
		this.image = image;
		this.url = url;
	}

	@ApiProperty()
	title: string;

	@ApiProperty()
	description: string;

	@ApiPropertyOptional({ type: OpenGraphImageData })
	image?: OpenGraphImageData;

	@ApiProperty()
	url: string;
}
export class LinkElementContent {
	constructor({ url, openGraphData }: LinkElementContent) {
		this.url = url;
		this.openGraphData = openGraphData;
	}

	@ApiProperty()
	url: string;

	@ApiPropertyOptional({ type: OpenGraphData })
	openGraphData?: OpenGraphData;
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
