import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { SanitizeHtml } from '@shared/controller';

export class RenameBodyParams {
	@IsString()
	@ApiProperty({
		required: true,
		nullable: false,
	})
	@SanitizeHtml()
	title!: string;
}
