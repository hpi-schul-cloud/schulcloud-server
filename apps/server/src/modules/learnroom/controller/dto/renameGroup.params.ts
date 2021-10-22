import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateNested, IsNumber, Min } from 'class-validator';

/**
 * DTO for Updating a the group name of a grid element.
 * A PartialType is a helper which allows to extend an existing class by making all its properties optional.
 */

export class ElementPosition {
	@IsNumber()
	@Min(0)
	x: number;

	@IsNumber()
	@Min(0)
	y: number;
}
export class UpdateGroupParams {
	@IsOptional()
	@IsString()
	@ApiPropertyOptional({
		description: 'Title of the Group grid element',
	})
	title: string;
}
