import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PatchAccountParams {
	@IsString()
	@ApiProperty({
		description: 'The actual user password to authentitcate .',
		required: true,
	})
	passwordOld!: string;

	@IsString()
	@ApiProperty({
		description: 'The preferred language for the current user.',
		required: false,
	})
	passwordNew?: string;

	@IsString()
	@ApiProperty({
		description: 'The preferred language for the current user.',
		required: false,
	})
	email?: string;

	@IsString()
	@ApiProperty({
		description: 'The preferred language for the current user.',
		required: false,
	})
	firstName?: string;

	@IsString()
	@ApiProperty({
		description: 'The preferred language for the current user.',
		required: false,
	})
	lastName?: string;

	@IsString()
	@ApiProperty({
		description: 'The preferred language for the current user.',
		required: false,
	})
	language?: string;
}
