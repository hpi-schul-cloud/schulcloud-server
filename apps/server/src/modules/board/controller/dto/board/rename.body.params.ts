import { ApiProperty } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller/transformer/sanitize-html.transformer';
import { IsString } from 'class-validator';

export class RenameBodyParams {
	@IsString()
	@ApiProperty({
		required: true,
		nullable: false,
	})
	@SanitizeHtml()
	title!: string;
}
