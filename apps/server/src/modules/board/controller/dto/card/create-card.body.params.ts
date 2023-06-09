import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContentElementType } from '@shared/domain';
import { IsEnum } from 'class-validator';
import { CreateContentElementBody } from '../element';

export class CreateCardBodyParams {
	@IsEnum(ContentElementType, { each: true })
	@ApiPropertyOptional({
		required: false,
		isArray: true,
		enum: ContentElementType,
	})
	requiredEmptyElements?: CreateContentElementBody[];
}
