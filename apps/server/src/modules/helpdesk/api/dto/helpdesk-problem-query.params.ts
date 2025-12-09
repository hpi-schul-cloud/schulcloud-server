import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class HelpdeskProblemQueryParams {
	@ApiProperty({ required: false, description: 'Number of results to return' })
	@IsOptional()
	@IsNumber()
	$limit?: number;

	@ApiProperty({ required: false, description: 'Number of results to skip' })
	@IsOptional()
	@IsNumber()
	$skip?: number;

	@ApiProperty({ required: false, description: 'Sort field and direction' })
	@IsOptional()
	@IsString()
	$sort?: string;

	@ApiProperty({ required: false, description: 'Filter by school ID' })
	@IsOptional()
	@IsString()
	schoolId?: string;
}
