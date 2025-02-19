import { ApiProperty } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller/transformer';
import { IsArray, IsEnum, IsMongoId, IsString, MaxLength, MinLength } from 'class-validator';
import { EntityId } from '@shared/domain/types';
import { DomainName } from '../../../../domain/types';

export class CreateDeletionBatchBodyParams {
	@ApiProperty({
		description: 'The name of the deletion request batch',
		required: true,
	})
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	@SanitizeHtml()
	name!: string;

	@ApiProperty({
		description: 'The targetRefDomain of the deletion request batch',
		enum: DomainName,
		enumName: 'DomainName',
	})
	@IsEnum(DomainName)
	targetRefDomain!: DomainName;

	@ApiProperty({
		description: 'Array of targetRefIds to process in batch',
		required: true,
		type: [String],
	})
	@IsArray()
	@IsMongoId({ each: true })
	targetRefIds: EntityId[] = [];
}
