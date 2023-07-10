import { ApiProperty } from '@nestjs/swagger';
import { ContentElementType } from '@shared/domain';
import { IsEnum } from 'class-validator';

export class CreateContentElementBodyParams {
	@IsEnum(ContentElementType)
	@ApiProperty({
		description: 'The type of element',
		enum: ContentElementType,
		required: true,
		nullable: false,
		enumName: 'ContentElementType',
	})
	type!: ContentElementType;
}
