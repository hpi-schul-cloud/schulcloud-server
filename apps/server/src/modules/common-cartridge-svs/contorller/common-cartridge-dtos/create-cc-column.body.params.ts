import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCcCardBodyParams } from './create-cc-card.body.params';
export class CreateCcColumnBodyParams {
	@ApiProperty({
		description: 'the title of the column',
		required: true,
	})
	public title!: string;

	@ApiPropertyOptional({
		description: 'cards of the column',
		type: [CreateCcCardBodyParams],
		required: false,
	})
	public cards?: CreateCcCardBodyParams[] | undefined;
}
