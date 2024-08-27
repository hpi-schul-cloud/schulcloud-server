import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RoomListParams {
	@IsOptional()
	@IsString()
	@ApiPropertyOptional({ description: 'search string for room names.' })
	name?: string;
}
