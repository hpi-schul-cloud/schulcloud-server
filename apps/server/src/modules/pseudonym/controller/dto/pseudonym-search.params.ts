import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class PseudonymSearchParams {
	// TODO: use better descriptions @igor
	@ApiPropertyOptional({ description: 'Pseudonym' })
	@IsString()
	@IsOptional()
	pseudonym?: string;

	@ApiPropertyOptional({ description: 'User id' })
	@IsString()
	@IsOptional()
	userId?: string;

	@ApiPropertyOptional({ description: 'Tool id' })
	@IsString()
	@IsOptional()
	toolId?: string;
}
