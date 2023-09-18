import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentElementType } from '@shared/domain';
import { IsOptional } from 'class-validator';
import { TimestampsResponse } from '../timestamps.response';

export class FileElementContent {
	constructor({ caption, alternativeText }: FileElementContent) {
		this.caption = caption;
		this.alternativeText = alternativeText;
	}

	@ApiPropertyOptional()
	@IsOptional()
	caption?: string;

	@ApiPropertyOptional()
	@IsOptional()
	alternativeText?: string;
}

export class FileElementResponse {
	constructor({ id, content, timestamps, type }: FileElementResponse) {
		this.id = id;
		this.content = content;
		this.timestamps = timestamps;
		this.type = type;
	}

	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty({ enum: ContentElementType, enumName: 'ContentElementType' })
	type: ContentElementType.FILE;

	@ApiProperty()
	content: FileElementContent;

	@ApiProperty()
	timestamps: TimestampsResponse;
}
