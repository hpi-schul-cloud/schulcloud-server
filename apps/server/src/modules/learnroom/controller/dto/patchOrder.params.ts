import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId } from 'class-validator';

/**
 * DTO for Patching the order of elements within the board.
 */
export class PatchOrderParams {
	@IsArray()
	@IsMongoId({ each: true })
	@ApiProperty({
		description: 'Array ids determining the new order',
	})
	elements!: string[];
}
