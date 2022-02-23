/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain';
import { FileRecordTargetType } from '@shared/domain/entity/filerecord.entity';
import { IsEnum, IsMongoId } from 'class-validator';

export class UploadFileParams {
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

export class DownloadFileParams {
	@ApiProperty()
	@IsMongoId()
	fileRecordId!: EntityId;

	@ApiProperty()
	fileName!: string;
}
