import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ExternalToolMediumStatus } from '../../../enum';

export class ExternalToolMediumParams {
	@ApiProperty({
		description: 'The status of the medium',
		required: true,
		enum: ExternalToolMediumStatus,
		enumName: 'ExternalToolMediumStatus',
	})
	@IsEnum(ExternalToolMediumStatus)
	public status!: ExternalToolMediumStatus;

	@IsString()
	@IsOptional()
	@IsNotEmpty()
	@ApiPropertyOptional({ type: String, description: 'Id of the medium' })
	public mediumId?: string;

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

	@IsDate()
	@IsOptional()
	@ApiPropertyOptional({ type: Date, description: 'The date the medium was last modified' })
	public modifiedAt?: Date;
}
