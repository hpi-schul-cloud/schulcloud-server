import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';
import { IsEnum, IsMongoId, IsNumber, IsString } from 'class-validator';
import { FileOwnerModel } from '../../domain';

export class ArchiveFileParams {
	@ApiProperty()
	@IsMongoId()
	ownerId!: EntityId;

	@ApiProperty()
	@IsEnum(FileOwnerModel)
	ownerType!: FileOwnerModel;

	@ApiProperty()
	@IsString()
	archiveName!: string;

	@ApiPropertyOptional({ default: 6 })
	@IsNumber()
	compression?: number;
}
