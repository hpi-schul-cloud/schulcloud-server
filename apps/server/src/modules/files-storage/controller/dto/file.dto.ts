import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain';
import { FileRecordTargetType } from '@shared/domain/entity/filerecord.entity';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsMongoId, ValidateNested } from 'class-validator';

export class FileMetaDto {
	@ApiProperty()
	@IsMongoId()
	schoolId!: EntityId;

	@ApiProperty()
	@IsMongoId()
	targetId!: EntityId;

	@ApiProperty({ enum: FileRecordTargetType })
	@IsEnum(FileRecordTargetType)
	targetType!: FileRecordTargetType;
}

export class FileDto {
	@ApiProperty({ type: 'string', format: 'binary' })
	file!: string;
}
export class FileUploadDto {
	@ApiProperty({ type: FileDto })
	file!: string;

	@ApiProperty({ type: FileMetaDto })
	@Transform(({ value }: { value: string }): unknown => JSON.parse(value))
	@Type(() => FileMetaDto)
	@ValidateNested()
	meta!: FileMetaDto;
}

export class FileDownloadDto {
	@ApiProperty()
	@IsMongoId()
	fileRecordId!: EntityId;

	@ApiProperty()
	fileName!: string;
}
