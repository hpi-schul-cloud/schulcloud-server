import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum MatchCreatorFilter {
	AUTO = 'auto',
	MANUAL = 'admin',
	NONE = 'none',
}

// TODO DTO validation in all is not completed
export class ImportUserFilterQuery {
	@ApiPropertyOptional()
	firstName?: string;

	@ApiPropertyOptional()
	lastName?: string;

	@ApiPropertyOptional()
	loginName?: string;

	@ApiPropertyOptional({ enum: MatchCreatorFilter })
	@IsEnum(MatchCreatorFilter)
	match?: MatchCreatorFilter;

	@ApiPropertyOptional()
	flagged?: boolean;
}
