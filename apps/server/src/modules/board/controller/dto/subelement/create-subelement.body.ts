import { ApiProperty } from '@nestjs/swagger';
import { ContentSubElementType } from '@shared/domain';
import { IsEnum } from 'class-validator';

// TODO: remove
export class CreateSubElementBody {
	@IsEnum(ContentSubElementType)
	@ApiProperty({
		description: 'The type of subelement',
		enum: ContentSubElementType,
		required: true,
		nullable: false,
		enumName: 'SubElementType',
	})
	type!: ContentSubElementType;
}
