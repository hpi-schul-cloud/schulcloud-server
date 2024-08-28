import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Controller, ForbiddenException, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiValidationError } from '@shared/common';
import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { ErrorResponse } from '@src/core/error/dto';
import { IFindOptions } from '@shared/domain/interface';
import { RoomUc } from './room.uc';
import { Room } from '../domain';
import { RoomListResponse } from './dto/response/room-list.response';
import { RoomMapper } from './mapper/room.mapper';
import { RoomPaginationParams } from './dto/request/room-pagination.params';

@ApiTags('Room')
@JwtAuthentication()
@Controller('rooms')
export class RoomController {
	constructor(private readonly roomUc: RoomUc) {}

	@Get()
	@ApiOperation({ summary: 'Get a list of rooms.' })
	@ApiResponse({ status: HttpStatus.OK, description: 'Returns a list of rooms.', type: RoomListResponse })
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	// @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	async getRooms(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() pagination: RoomPaginationParams
	): Promise<RoomListResponse> {
		const findOptions: IFindOptions<Room> = { pagination };

		const rooms = await this.roomUc.getRooms(currentUser.userId, findOptions);

		const response = RoomMapper.mapToRoomListResponse(rooms, pagination);

		return response;
	}
}
