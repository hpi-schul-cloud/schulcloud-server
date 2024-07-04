import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentElementType } from '@modules/board/domain';
import { IsEnum, IsInt, IsMongoId, IsOptional, Min } from 'class-validator';

export class CreateContentElementMessageParams {
	@IsMongoId()
	cardId!: string;

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
