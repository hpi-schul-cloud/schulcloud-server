import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller/dto';
import { IsInt, Max, Min } from 'class-validator';

export class RoomPaginationParams extends PaginationParams {
	@IsInt()
	@Min(1)
	@Max(500)
	@ApiPropertyOptional({ description: 'Page limit, defaults to 500.', minimum: 1, maximum: 500 })
	override limit?: number = 500;
}
