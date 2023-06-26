import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentElementType } from '@shared/domain';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export class CreateContentElementBody {
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
	@IsNumber()
	@ApiPropertyOptional({
		description: 'to bring element to a specific position, default is last position',
		type: Number,
		required: false,
		nullable: false,
	})
	toPosition?: number;
}
