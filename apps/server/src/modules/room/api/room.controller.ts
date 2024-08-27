import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Controller, ForbiddenException, Get, HttpStatus, Query, UnauthorizedException } from '@nestjs/common';
import { ApiValidationError } from '@shared/common';
import { CurrentUser, ICurrentUser } from '@infra/auth-guard';
import { EntityId } from '@shared/domain/types';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { RoomUc } from './room.uc';
import { ErrorResponse } from '../../../core/error/dto';
import { RoomListResponse } from './dto/response/room-list.response';
import { RoomMapper } from './mapper/room.mapper';

import { RoomPaginationParams } from './dto/response/room-pagination.params';
import { RoomListParams } from './dto/request/room-list.params';
import { Room } from '../domain';
import { Group } from '../../group';

@ApiTags('Room')
@Controller('room')
export class RoomController {
	constructor(private readonly roomUc: RoomUc) {}

	@Get()
	@ApiOperation({ summary: 'Get a list of rooms.' })
	@ApiResponse({ status: HttpStatus.OK, description: 'Returns a list of rooms.', type: RoomListResponse })
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	async getRooms(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() pagination: RoomPaginationParams,
		@Query() params: RoomListParams
	): Promise<RoomListResponse> {
		const findOptions: IFindOptions<Room> = { pagination };

		const rooms = await this.roomUc.getRooms(currentUser.userId, findOptions, params.name);

		const response = RoomMapper.mapToRoomListResponse(rooms, pagination);

		return response;
	}
}
