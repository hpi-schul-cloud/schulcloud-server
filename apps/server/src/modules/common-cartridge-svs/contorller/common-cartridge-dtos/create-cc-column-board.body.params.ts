import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCcColumnBodyParams } from './create-cc-column.body.params';

export class CreateCcBoardBodyParams {
	@ApiProperty({
		description: 'title of the column boards',
		required: false,
	})
	public title?: string;

	@ApiProperty({
		description: 'layout of the column boards',
		required: false,
		default: 'columns',
	})
	public layout?: string;

	@ApiProperty({
		description: 'type of parent of the column boards',
		required: false,
		default: 'course',
	})
	public parentType?: string;

	@ApiPropertyOptional({
		description: 'column of the course',
		type: [CreateCcColumnBodyParams],
		required: false,
	})
	public columns: CreateCcColumnBodyParams[] | undefined;
}
