import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RenameBodyParams {
	@IsString()
	@ApiProperty({
		required: true,
		nullable: false,
	})
	title!: string;
}
