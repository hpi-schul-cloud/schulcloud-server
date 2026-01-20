import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FwuItem } from '../../interface/fwu-item';

export class FwuItemResponse implements FwuItem {
	@ApiProperty()
	id: string;

	@ApiProperty()
	title: string;

	@ApiProperty()
	targetUrl: string;

	@ApiProperty()
	thumbnailUrl: string;

	@ApiPropertyOptional()
	description?: string;

	constructor(item: FwuItemResponse) {
		this.id = item.id;
		this.title = item.title;
		this.targetUrl = item.targetUrl;
		this.thumbnailUrl = item.thumbnailUrl;
		this.description = item.description;
	}
}
