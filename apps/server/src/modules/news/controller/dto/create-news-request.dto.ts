import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsString } from 'class-validator';

/**
 * DTO for creating a news document.
 */
export class CreateNewsRequestDto {
	@ApiProperty()
	@IsString()
	title: string;
	@ApiProperty()
	@IsString()
	body: string;
	@ApiProperty()
	@IsDate()
	publishedOn: Date;
}
