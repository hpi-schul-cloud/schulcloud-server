import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsString } from 'class-validator';

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
}
