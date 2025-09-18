import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCcColumnBodyParams } from './create-cc-column.body.params';
import { IsArray, IsString } from 'class-validator';

export class CreateCcBoardBodyParams {
	@ApiProperty({
		description: 'title of the column boards',
		required: false,
	})
	@IsString()
	public title?: string;

	@ApiProperty({
		description: 'layout of the column boards',
		required: false,
		default: 'columns',
	})
	@IsString()
	public layout?: string;

	@ApiProperty({
		description: 'type of parent of the column boards',
		required: false,
		default: 'course',
	})
	@IsString()
	public parentType?: string;

	@ApiPropertyOptional({
		description: 'column of the course',
		type: [CreateCcColumnBodyParams],
		required: false,
	})
	@IsArray({ each: true })
	public columns?: CreateCcColumnBodyParams[];
}
