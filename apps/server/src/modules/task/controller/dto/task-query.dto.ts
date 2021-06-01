import { IsInt, Max, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TaskQueryDto {
	@IsInt()
	@Min(2015)
	@Max(2030)
	@IsOptional()
	@ApiProperty({ description: 'Requested year, otherwise default is used.', minimum: 2015, maximum: 2030 })
	year?;

	@IsInt()
	@Min(0)
	@IsOptional()
	@ApiProperty({ description: 'number of elements (not pages) to be skipped' })
	skip?;

	@IsInt()
	@Min(1)
	@Max(100)
	@IsOptional()
	@ApiProperty({ description: 'Page limit, defaults to 10.', minimum: 1, maximum: 99 })
	limit?;
}
