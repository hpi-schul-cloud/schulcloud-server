import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { ContentElementType } from '../../../domain';

export class CreateContentElementBodyParams {
	@IsEnum(ContentElementType)
	@ApiProperty({
		description: 'The type of element',
		enum: ContentElementType,
		required: true,
		nullable: false,
		enumName: 'ContentElementType',
	})
	type!: ContentElementType;

	@IsOptional()
	@IsInt()
	@Min(0)
	@ApiPropertyOptional({
		description: 'to bring element to a specific position, default is last position',
		type: Number,
		required: false,
		nullable: false,
	})
	toPosition?: number;
}
