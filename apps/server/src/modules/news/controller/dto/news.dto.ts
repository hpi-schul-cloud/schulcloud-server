import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';

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

/**
 * DTO for Updating a news document.
 * A PartialType is a halper which allows to extend an existing class by making all its properties optional.
 */
export class UpdateNewsDto extends PartialType(CreateNewsDto) {}
