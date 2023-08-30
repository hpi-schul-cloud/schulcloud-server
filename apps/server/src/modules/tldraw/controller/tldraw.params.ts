import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TldrawDeleteParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The name of drawing that should be deleted.',
		required: true,
		nullable: false,
	})
	docName!: string;
}
