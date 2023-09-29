import { ApiExtraModels, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentElementType } from '@shared/domain';
import { OpenGraphData } from '@src/modules/board/service';
import { TimestampsResponse } from '../timestamps.response';

@ApiExtraModels(OpenGraphData)
export class LinkElementContent {
	constructor({ url, openGraphData }: LinkElementContent) {
		this.url = url;
		this.openGraphData = openGraphData;
	}

	@ApiProperty()
	url: string;

	@ApiPropertyOptional({ type: 'OpenGraphData' })
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
