import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCcCardBodyParams } from './create-cc-card.body.params';
import { IsArray, IsString } from 'class-validator';
export class CreateCcColumnBodyParams {
	@ApiProperty({
		description: 'the title of the column',
		required: true,
	})
	@IsString()
	public title!: string;

	@ApiPropertyOptional({
		description: 'cards of the column',
		type: [CreateCcCardBodyParams],
		required: false,
	})
	@IsArray({ each: true })
	public cards?: CreateCcCardBodyParams[];
}
