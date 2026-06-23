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
	public requiredEmptyElements?: ContentElementType[];

	@IsInt()
	@Min(0)
	@IsOptional()
	@ApiPropertyOptional({
		required: false,
		description: 'Position to insert the card at within the column. If omitted, the card is appended at the end.',
		minimum: 0,
	})
	public position?: number;
}
