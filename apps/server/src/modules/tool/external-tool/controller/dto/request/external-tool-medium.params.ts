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
	status!: ExternalToolMediumStatus;

	@IsString()
	@IsOptional()
	@IsNotEmpty()
	@ApiPropertyOptional({ type: String, description: 'Id of the medium' })
	mediumId?: string;

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

	@IsDate()
	@IsOptional()
	@ApiPropertyOptional({ type: Date, description: 'The date the medium was last modified' })
	modifiedAt?: Date;
}
