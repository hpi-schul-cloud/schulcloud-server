import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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

	@IsDate()
	@IsOptional()
	@ApiPropertyOptional({ type: Date, description: 'The date the medium was last modified' })
	public modifiedAt?: Date;
}
