import { ApiProperty } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller';
import { IsString } from 'class-validator';

export class ShareTokenImportBodyParams {
	@IsString()
	@SanitizeHtml()
	@ApiProperty({
		description: 'the new name of the imported object.',
		required: true,
		nullable: false,
	})
	newName!: string;
}
