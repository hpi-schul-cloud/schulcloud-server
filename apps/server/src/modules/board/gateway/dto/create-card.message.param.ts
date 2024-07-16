import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
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
}
