import { ApiProperty } from '@nestjs/swagger';
import { SanitizeHtml } from '@shared/controller';
import { IsOptional, IsString } from 'class-validator';
import { ImportDestination, ImportDestinationType } from '../../uc';

export class ImportDestinationBodyParams {
	@IsString()
	@ApiProperty({
		description: 'The id of the destination object.',
		required: true,
		nullable: false,
	})
	id!: string;

	@ApiProperty({
		enum: ImportDestinationType,
		description: 'The type of the destination object.',
		required: true,
		nullable: false,
	})
	type!: ImportDestinationType;
}

export class ShareTokenImportBodyParams {
	@IsString()
	@SanitizeHtml()
	@ApiProperty({
		description: 'the new name of the imported object.',
		required: true,
		nullable: false,
	})
	newName!: string;

	@IsOptional()
	@ApiProperty({
		type: ImportDestinationBodyParams,
		name: 'ImportDestination',
		description: 'Destination of the share token import',
		required: false,
		nullable: true,
	})
	destination?: ImportDestination;
}
