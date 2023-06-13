import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ExternalToolSearchParams {
	@ApiPropertyOptional()
	@IsString()
	@IsOptional()
	name?: string;
}
