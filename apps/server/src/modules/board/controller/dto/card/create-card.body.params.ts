import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContentElementType } from '@shared/domain';
import { IsEnum, IsOptional } from 'class-validator';

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
