import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsMongoId, IsOptional, Min } from 'class-validator';
import { ContentElementType } from '../../domain';

export class CreateCardMessageParams {
	@IsMongoId()
	columnId!: string;

	@IsEnum(ContentElementType, { each: true })
	@IsOptional()
	@ApiPropertyOptional({
		required: false,
		isArray: true,
		enum: ContentElementType,
	})
	requiredEmptyElements?: ContentElementType[];

	@IsInt()
	@Min(0)
	@IsOptional()
	@ApiPropertyOptional({
		description: 'Position to insert the card at within the column. If omitted, the card is appended at the end.',
		type: Number,
	})
	position?: number;
}
