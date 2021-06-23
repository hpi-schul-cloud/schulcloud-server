import { IsInt, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationQueryDto {
	@IsInt()
	@Min(0)
	@ApiProperty({ description: 'number of elements (not pages) to be skipped' })
	skip: number = 0;
	@IsInt()
	@Min(1)
	@Max(200)
	@ApiProperty({ description: 'Page limit, defaults to 100.', minimum: 1, maximum: 200 })
	limit: number = 100;
}
