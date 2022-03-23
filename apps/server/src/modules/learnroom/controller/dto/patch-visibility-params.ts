import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/**
 * DTO for Patching the visibility of a board element.
 */
export class PatchVisibilityParams {
	@IsBoolean()
	@ApiProperty({
		description: 'true to publish the element, false to unpublish',
	})
	visibility!: boolean;
}
