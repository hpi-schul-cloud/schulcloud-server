import { IsInt, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryDto {
	@IsInt()
	@Min(2015)
    @Max(2030)
	@ApiProperty({ description: 'Requested year, otherwise default is used.', minimum: 2015, maximum: 2030 })
	year?: number;
	@IsInt()
	@Min(0)
	@ApiProperty({ description: 'number of elements (not pages) to be skipped' })
	skip?: number = 0;
	@IsInt()
	@Min(1)
	@Max(100)
	@ApiProperty({ description: 'Page limit, defaults to 10.', minimum: 1, maximum: 99 })
	limit?: number = 10;
}

export type IQueryDto = QueryDto;
