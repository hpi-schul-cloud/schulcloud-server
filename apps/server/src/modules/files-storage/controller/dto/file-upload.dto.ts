import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsMongoId, ValidateNested } from 'class-validator';

export class FileMetaDto {
	@ApiProperty()
	@IsMongoId()
	schoolId!: string;

	@ApiProperty()
	@IsMongoId()
	targetId!: string;
}

export class FileUploadDto {
	@ApiProperty({ type: 'string', format: 'binary' })
	file!: string;

	@ApiProperty({ type: FileMetaDto })
	@Transform(({ value }: { value: string }): unknown => JSON.parse(value))
	@Type(() => FileMetaDto)
	@ValidateNested()
	meta!: FileMetaDto;
}
