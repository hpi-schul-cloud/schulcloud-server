import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ContentElementType } from '../../../types';

export class ElementTypeParams {
	@IsEnum(ContentElementType)
	@ApiProperty({
		description: 'The type of element',
		enum: ContentElementType,
		required: true,
		nullable: false,
	})
	type!: ContentElementType;
}
