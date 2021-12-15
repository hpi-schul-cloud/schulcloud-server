import { ApiPropertyOptional } from '@nestjs/swagger';

export class ImportUserFilterQuery {
	@ApiPropertyOptional()
	firstName?: string;

	@ApiPropertyOptional()
	lastName?: string;

	@ApiPropertyOptional()
	loginName?: string;

	@ApiPropertyOptional()
	match?: 'no-match' | 'admin' | 'auto';

	@ApiPropertyOptional()
	flagged?: boolean;
}
