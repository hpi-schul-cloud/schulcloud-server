/* istanbul ignore file */

import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain';
import { FileRecordParentType } from '@shared/domain/entity/filerecord.entity';
import { Allow, IsEnum, IsMongoId, IsString } from 'class-validator';

export class UploadFileParams {
	@ApiProperty()
	@IsMongoId()
	schoolId!: EntityId;

	@ApiProperty()
	@IsMongoId()
	parentId!: EntityId;

	@ApiProperty({ enum: FileRecordParentType })
	@IsEnum(FileRecordParentType)
	parentType!: FileRecordParentType;
}

export class FileDto {
	@ApiProperty({ type: 'string', format: 'binary' })
	@Allow()
	file!: string;
}

export class DownloadFileParams {
	@ApiProperty()
	@IsMongoId()
	fileRecordId!: EntityId;

	@ApiProperty()
	@IsString()
	fileName!: string;
}
