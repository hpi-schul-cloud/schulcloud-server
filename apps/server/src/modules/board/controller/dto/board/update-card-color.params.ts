import { ApiProperty } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller/transformer';
import { IsString } from 'class-validator';

export class UpdateCardColorBodyParams {
	@IsString()
	@ApiProperty({
		required: true,
		nullable: false,
	})
	@SanitizeHtml()
	color!: string;
}
