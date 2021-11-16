import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * DTO for Patching a the group name of a grid element.
 */
export class PatchGroupParams {
	constructor({ title }: PatchGroupParams) {
		this.title = title;
	}

	@IsString()
	@ApiProperty({
		description: 'Title of the Group grid element',
	})
	title: string;
}
