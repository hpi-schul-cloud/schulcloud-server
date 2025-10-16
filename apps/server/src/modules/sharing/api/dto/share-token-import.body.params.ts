import { ApiProperty } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller/transformer';
import { IsOptional, IsString } from 'class-validator';

export class ShareTokenImportBodyParams {
	@IsString()
	@SanitizeHtml()
	@ApiProperty({
		description: 'the new name of the imported object.',
		required: true,
		nullable: false,
	})
	newName!: string;

	@IsOptional()
	@IsString()
	@ApiProperty({
		description: 'Id of the parent to which the imported object will be added.',
		required: false,
		nullable: true,
	})
	destinationId?: string;
}
