import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MediaSourceDataFormat } from '@modules/media-source';

export class ExternalToolMediumParams {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ type: String, description: 'Id of the medium' })
	public mediumId!: string;

	@IsString()
	@IsOptional()
	@IsNotEmpty()
	@ApiPropertyOptional({ type: String, description: 'Publisher of the medium' })
	public publisher?: string;

	@IsString()
	@IsOptional()
	@IsNotEmpty()
	@ApiPropertyOptional({ type: String, description: 'The id of the media source' })
	public mediaSourceId?: string;

	@IsOptional()
	@IsEnum(MediaSourceDataFormat, { each: true })
	@ApiPropertyOptional({
		enum: MediaSourceDataFormat,
		enumName: 'MediaSourceDataFormat',
		description: 'Restrict media sources to a specific format',
	})
	public format?: MediaSourceDataFormat;

	@IsDate()
	@IsOptional()
	@ApiPropertyOptional({ type: Date, description: 'The date the medium was last modified' })
	public modifiedAt?: Date;
}
