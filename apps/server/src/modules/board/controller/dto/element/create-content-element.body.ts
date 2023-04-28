import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ContentElementType } from '../../../types';

export class CreateContentElementBody {
	@IsEnum(ContentElementType)
	@ApiProperty({
		description: 'The type of element',
		enum: ContentElementType,
		required: true,
		nullable: false,
	})
	type!: ContentElementType;
}
