import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * DTO for Updating a the group name of a grid element.
 * A PartialType is a helper which allows to extend an existing class by making all its properties optional.
 */
export class UpdateGroupNameParams {
	@IsOptional()
	@IsString()
	@ApiPropertyOptional({
		description: 'Title of the Group grid element',
	})
	title: string;
}
