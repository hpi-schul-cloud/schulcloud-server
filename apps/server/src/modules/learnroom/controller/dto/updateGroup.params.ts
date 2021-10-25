import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * DTO for Updating a the group name of a grid element.
 */
export class UpdateGroupParams {
	@IsString()
	@ApiProperty({
		description: 'Title of the Group grid element',
	})
	title: string;
}
