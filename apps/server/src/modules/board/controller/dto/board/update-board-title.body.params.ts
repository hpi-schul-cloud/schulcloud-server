import { ApiProperty } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller/transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateBoardTitleParams {
	@IsString()
	@ApiProperty({
		required: true,
	})
	@SanitizeHtml()
	@MaxLength(100)
	@MinLength(1)
	title!: string;
}
