import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ExternalToolSearchParams {
	@ApiPropertyOptional({ description: 'Name of the external tool' })
	@IsString()
	@IsOptional()
	name?: string;

	@ApiPropertyOptional({ description: 'OAuth2 client id of the external tool' })
	@IsString()
	@IsOptional()
	clientId?: string;
}
