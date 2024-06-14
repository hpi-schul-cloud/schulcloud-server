import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
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
}
