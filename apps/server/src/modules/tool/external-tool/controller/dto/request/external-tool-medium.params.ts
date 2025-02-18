import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDate, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MediaSourceDataFormat } from '@modules/media-source';

export class ExternalToolMediumParams {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ type: String, description: 'Id of the medium' })
	mediumId!: string;

	@IsString()
	@IsOptional()
	@IsNotEmpty()
	@ApiPropertyOptional({ type: String, description: 'Publisher of the medium' })
	publisher?: string;

	@IsString()
	@IsOptional()
	@IsNotEmpty()
	@ApiPropertyOptional({ type: String, description: 'The id of the media source' })
	mediaSourceId?: string;

	@IsArray()
	@IsOptional()
	@IsEnum(MediaSourceDataFormat, { each: true })
	@ApiPropertyOptional({
		enum: MediaSourceDataFormat,
		enumName: 'MediaSourceDataFormat',
		isArray: true,
		description: 'Restrict media sources to a specific format',
	})
	format?: MediaSourceDataFormat;

	@IsDate()
	@IsOptional()
	@ApiPropertyOptional({ type: Date, description: 'The date the medium was last modified' })
	modified?: Date;
}
