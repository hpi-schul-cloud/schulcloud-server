import { IsInt, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class YearsQueryDto {
	@IsInt()
	@Min(2015)
    @Max(2030)
	@ApiProperty({ description: 'Requested year, otherwise default is used.', minimum: 2015, maximum: 2030 })
	year?: number = 2020;
}
