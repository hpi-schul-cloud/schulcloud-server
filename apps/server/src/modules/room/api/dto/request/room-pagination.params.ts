import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller/dto';
import { IsInt } from 'class-validator';

export class RoomPaginationParams extends PaginationParams {
	@IsInt()
	@ApiPropertyOptional({ description: 'Page limit, defaults to 1000.' })
	override limit?: number = 1000;
}
