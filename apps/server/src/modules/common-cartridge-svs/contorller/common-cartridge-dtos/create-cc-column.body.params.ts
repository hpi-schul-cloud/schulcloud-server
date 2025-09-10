import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCcCardBodyParams } from './create-cc-card.body.params';
import { IsBoolean } from 'class-validator';

export class CreateCcColumnBodyParams {
	@ApiProperty({
		description: 'the title of the column',
		required: true,
	})
	public title!: string;

	@ApiProperty({
		description: 'column is a resource',
		required: true,
	})
	@IsBoolean()
	public isResource!: boolean;

	@ApiPropertyOptional({
		description: 'cards of the column',
		type: [CreateCcCardBodyParams],
		required: false,
	})
	public cards?: CreateCcCardBodyParams[] | undefined;
}
