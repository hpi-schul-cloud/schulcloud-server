import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ExternalToolMediumParams {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({ type: String, description: 'Id of the medium' })
	mediumId!: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({ type: String, description: 'Publisher of the medium' })
	publisher?: string;
}
