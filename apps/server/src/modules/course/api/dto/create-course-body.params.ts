import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateCourseBodyParams {
	@IsString()
	@ApiProperty({
		description: 'The name of the course',
		required: true,
		nullable: false,
	})
	public name!: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({
		description: 'The color of the course icon',
	})
	public color?: string;
}
