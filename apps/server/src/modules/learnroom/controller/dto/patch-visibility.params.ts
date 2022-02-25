import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/**
 * DTO for Patching the visibility of a board element.
 */
export class PatchVisibilityParams {
	@IsBoolean()
	@ApiProperty({
		description: 'Title of the Group grid element',
	})
	visibility!: boolean;
}
