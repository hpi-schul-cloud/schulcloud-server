import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for creating a news document.
 */
export class CreateNewsDto {
	@ApiProperty()
	title: string;
	@ApiProperty()
	body: string;
	@ApiProperty()
	publishedOn: Date;
}
