import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
	Controller,
	Delete,
	ForbiddenException,
	Get,
	HttpStatus,
	NotFoundException,
	Param,
	Query,
	UnauthorizedException,
} from '@nestjs/common';
import { ApiValidationError } from '@shared/common';
import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { ErrorResponse } from '@src/core/error/dto';
import { IFindOptions } from '@shared/domain/interface';
import { RoomUc } from './room.uc';
import { Room } from '../domain';
import { RoomListResponse } from './dto/response/room-list.response';
import { RoomMapper } from './mapper/room.mapper';
import { RoomPaginationParams } from './dto/request/room-pagination.params';
import { RoomDetailsResponse } from './dto';
import { RoomUrlParams } from './dto/request';

@ApiTags('Room')
@JwtAuthentication()
@Controller('rooms')
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
		@Query() pagination: RoomPaginationParams
	): Promise<RoomListResponse> {
		const findOptions: IFindOptions<Room> = { pagination };

		const rooms = await this.roomUc.getRooms(currentUser.userId, findOptions);

		const response = RoomMapper.mapToRoomListResponse(rooms, pagination);

		return response;
	}

	@Get(':roomId')
	@ApiOperation({ summary: 'Get the details of a room' })
	@ApiResponse({ status: HttpStatus.OK, description: 'Returns the details of a room', type: RoomDetailsResponse })
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	async getRoomDetails(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: RoomUrlParams
	): Promise<RoomDetailsResponse> {
		const room = await this.roomUc.getSingleRoom(currentUser.userId, urlParams.roomId);

		const response = RoomMapper.mapToRoomDetailsResponse(room);

		return response;
	}

	@Delete(':roomId')
	@ApiOperation({ summary: 'Delete a room' })
	@ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Deletion successful' })
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	async deleteRoom(@CurrentUser() currentUser: ICurrentUser, @Param() urlParams: RoomUrlParams): Promise<void> {
		await this.roomUc.deleteRoom(currentUser.userId, urlParams.roomId);
	}
}
