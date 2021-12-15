import { ApiPropertyOptional } from '@nestjs/swagger';

export enum MatchCreatorFilter {
	AUTO = 'auto',
	MANUAL = 'admin',
	NONE = 'none',
}
export class ImportUserFilterQuery {
	@ApiPropertyOptional()
	firstName?: string;

	@ApiPropertyOptional()
	lastName?: string;

	@ApiPropertyOptional()
	loginName?: string;

	@ApiPropertyOptional({ enum: MatchCreatorFilter })
	match?: MatchCreatorFilter;

	@ApiPropertyOptional()
	flagged?: boolean;
}
