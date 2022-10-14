import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ShareTokenImportBodyParams {
	@IsString()
	@ApiProperty({
		description: 'the new name of the imported object.',
		required: true,
		nullable: false,
	})
	newName!: string;
}
