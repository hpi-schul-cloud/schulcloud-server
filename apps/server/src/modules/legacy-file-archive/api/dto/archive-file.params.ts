import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';
import { IsEnum, IsMongoId, IsString } from 'class-validator';
import { OwnerType } from '../../domain';

export class ArchiveFileParams {
	@ApiProperty()
	@IsMongoId()
	public ownerId!: EntityId;

	@ApiProperty()
	@IsEnum(OwnerType)
	public ownerType!: OwnerType;

	@ApiProperty()
	@IsString()
	public archiveName!: string;
}
