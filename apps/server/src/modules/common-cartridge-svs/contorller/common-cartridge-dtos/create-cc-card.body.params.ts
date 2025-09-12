import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { CreateCcCardElementBodyParams } from './create-cc-card-element.body.params';

export class CreateCcCardBodyParams {
	@ApiProperty({
		description: 'the title of the card',
		required: true,
	})
	@IsString()
	public title!: string;

	@ApiPropertyOptional({
		description: '',
		type: [CreateCcCardElementBodyParams],
		required: false,
	})
	public cardElements?: CreateCcCardElementBodyParams[] | undefined;
}
