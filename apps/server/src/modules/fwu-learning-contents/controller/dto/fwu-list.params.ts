import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class FwuListParams {
	@ApiPropertyOptional()
	@IsBoolean()
	public refreshCache?: boolean;
}
