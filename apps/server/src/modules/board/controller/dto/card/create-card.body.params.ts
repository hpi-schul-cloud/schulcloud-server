import { ApiProperty } from '@nestjs/swagger';
import { ContentElementType } from '@shared/domain';
import { IsEnum } from 'class-validator';

export class CreateCardBodyParams {
	@IsEnum(ContentElementType, { each: true })
	@ApiProperty({
		required: false,
		isArray: true,
		enum: ContentElementType,
	})
	requiredEmptyElements?: ContentElementType[];
}
