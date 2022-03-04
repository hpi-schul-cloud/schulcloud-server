import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

/**
 * DTO for Patching a the group name of a grid element.
 */
export class PatchOrderParams {
	// TODO: check mongoId
	/* @ApiProperty({
		type: [String],
		description: 'Array ids determining the new order',
	}) */
	elements!: string[];
}
