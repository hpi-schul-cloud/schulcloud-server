import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';
import { IsMongoId, IsString } from 'class-validator';

export class CommonCartridgeStartImportBodyParams {
	@ApiProperty()
	@IsMongoId()
	public fileRecordId!: EntityId;

	@ApiProperty()
	@IsString()
	public fileName!: string;

	@ApiProperty()
	@IsString()
	public fileUrl!: string;
}
