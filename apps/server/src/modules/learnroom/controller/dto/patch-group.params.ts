import { ApiProperty } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller';
import { IsString } from 'class-validator';

/**
 * DTO for Patching a the group name of a grid element.
 */
export class PatchGroupParams {
	@IsString()
	@SanitizeHtml()
	@ApiProperty({
		description: 'Title of the Group grid element',
	})
	title!: string;
}
