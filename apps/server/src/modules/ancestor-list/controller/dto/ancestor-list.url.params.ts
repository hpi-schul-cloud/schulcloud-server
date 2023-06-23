import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId } from 'class-validator';
import { AncestorEntityType } from './ancestor.response';

export class AncestorListUrlParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the entity.',
		required: true,
		nullable: false,
	})
	entityId!: string;

	@ApiProperty({
		description: 'The type of the entity.',
		enum: AncestorEntityType,
		enumName: 'AncestorEntityType',
	})
	@IsEnum(AncestorEntityType)
	entityType!: AncestorEntityType;
}
