import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';
import { IsEnum, IsMongoId, IsString } from 'class-validator';
import { FileOwnerModel } from '../../domain';

export class ArchiveFileParams {
	@ApiProperty()
	@IsMongoId()
	public ownerId!: EntityId;

	@ApiProperty()
	@IsEnum(FileOwnerModel)
	public ownerType!: FileOwnerModel;

	@ApiProperty()
	@IsString()
	public archiveName!: string;
}
