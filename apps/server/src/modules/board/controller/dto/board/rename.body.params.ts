import { ApiProperty } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller/transformer';
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
