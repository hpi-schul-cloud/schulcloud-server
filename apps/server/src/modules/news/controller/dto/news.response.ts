import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { SchoolInfoResponse } from './school-info.response';
import { UserInfoResponse } from './user-info.response';

const NEWS_SOURCES = ['internal', 'rss'] as const;
type SourceType = typeof NEWS_SOURCES[number];
export class NewsResponse {
	@ApiProperty({ pattern: '[a-f0-9]{24}' })
	id: string;

	@ApiProperty()
	title: string;

	@ApiProperty()
	content: string;

	@ApiProperty()
	displayAt: Date;

	@ApiPropertyOptional({ type: 'string', enum: NEWS_SOURCES })
	source?: SourceType;

	@ApiPropertyOptional()
	target?: { id: string };

	@ApiPropertyOptional()
	targetModel?: string;

	@ApiProperty()
	school: SchoolInfoResponse;

	@ApiProperty()
	creator: UserInfoResponse;

	@ApiPropertyOptional()
	updater?: UserInfoResponse;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;

	@ApiProperty()
	permissions: string[];
}
