import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';
import { CreateCcBoardBodyParams } from './create-cc-column-board.body.params';

export class CreateCcCourseBodyParams {
	@ApiProperty({
		description: 'The title of the course',
		required: true,
	})
	@IsString()
	public name!: string;

	@ApiProperty({
		description: 'The color of the course',
		required: false,
	})
	@IsString()
	public color?: string;

	@ApiPropertyOptional({
		description: 'column boards of the course',
		type: [CreateCcBoardBodyParams],
		required: false,
	})
	@IsArray({ each: true })
	public columnBoard: CreateCcBoardBodyParams[] | undefined;
}
