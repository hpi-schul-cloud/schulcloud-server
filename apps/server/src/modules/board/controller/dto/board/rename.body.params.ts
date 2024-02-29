import { ApiProperty } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller';
import { IsString, MaxLength } from 'class-validator';

export class RenameBodyParams {
	@IsString()
	@ApiProperty({
		required: true,
		nullable: false,
	})
	@SanitizeHtml()
	@MaxLength(100)
	title!: string;
}
