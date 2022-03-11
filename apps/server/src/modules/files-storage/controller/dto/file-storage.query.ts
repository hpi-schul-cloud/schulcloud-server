import { IsInt, Max, Min, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ExpiresQuery {
	@IsInt()
	@Min(0)
	@Max(30)
	@IsOptional()
	@ApiPropertyOptional({
		description:
			'A optional query to modified the final deletion. Default is used 7 days. The file is final removed after the time.',
	})
	daysUntilExpiration?: number;
}
