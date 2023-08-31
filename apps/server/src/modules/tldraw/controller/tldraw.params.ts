import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TldrawDeleteParams {
	@IsString()
	@ApiProperty({
		description: 'The name of drawing that should be deleted.',
		required: true,
		nullable: false,
	})
	docName!: string;
}
