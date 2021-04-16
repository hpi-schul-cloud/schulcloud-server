import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for creating a news document.
 */
export class CreateNewsDto {
	@ApiProperty()
	readonly title: string;
	@ApiProperty()
	readonly body: string;
	@ApiProperty()
	readonly publishedOn: Date;
}
