import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { ContentElementType } from '../../../domain';

export class CreateCardBodyParams {
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
		description: 'Position within the column at which to insert the card. If omitted, the card is appended at the end.',
	})
	position?: number;
}
