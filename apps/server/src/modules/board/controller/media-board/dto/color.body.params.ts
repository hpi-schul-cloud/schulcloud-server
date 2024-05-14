import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ColorBodyParams {
	@IsString()
	@ApiProperty({
		required: true,
		nullable: false,
	})
	backgroundColor!: string;
}
