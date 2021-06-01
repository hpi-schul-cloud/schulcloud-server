import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsOptional, IsString } from 'class-validator';

/**
 * DTO for creating a news document.
 */
export class CreateNewsParams {
	@ApiProperty()
	@IsString()
	title: string;

	@ApiProperty()
	@IsString()
	body: string;

	@ApiProperty()
	@IsDate()
	displayAt: Date;

	@IsString()
	@IsOptional()
	@ApiProperty()
	targetModel: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional()
	targetId: string;
}
