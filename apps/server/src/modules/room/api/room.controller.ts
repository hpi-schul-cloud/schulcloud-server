import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import {
	Body,
	Controller,
	Delete,
	ForbiddenException,
	Get,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	Patch,
	Post,
	Put,
	Query,
	UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error';
import { IFindOptions } from '@shared/domain/interface';
import { ErrorResponse } from '@core/error/dto';
import { Room } from '../domain';
import { AddRoomMembersBodyParams } from './dto/request/add-room-members.body.params';
import { CreateRoomBodyParams } from './dto/request/create-room.body.params';
import { RemoveRoomMembersBodyParams } from './dto/request/remove-room-members.body.params';
import { RoomPaginationParams } from './dto/request/room-pagination.params';
import { RoomUrlParams } from './dto/request/room.url.params';
import { UpdateRoomBodyParams } from './dto/request/update-room.body.params';
import { RoomBoardListResponse } from './dto/response/room-board-list.response';
import { RoomDetailsResponse } from './dto/response/room-details.response';
import { RoomItemResponse } from './dto/response/room-item.response';
import { RoomListResponse } from './dto/response/room-list.response';
import { RoomMemberListResponse } from './dto/response/room-member-list.response';
import { RoomMapper } from './mapper/room.mapper';
import { RoomUc } from './room.uc';
import { ChangeRoomRoleBodyParams } from './dto/request/change-room-role.body.params';
import { RoomRoleResponse } from './dto/response/room-role.response';
import { PassOwnershipBodyParams } from './dto/request/pass-ownership.body.params';
import { RoomInvitationLinkListResponse } from './dto/response/room-invitation-link-list.response';
import { RoomInvitationLinkResponse } from './dto/response/room-invitation-link.response';
import { RoomInvitationLinkUc } from './room-invitation-link.uc';
import { RoomInvitationLinkMapper } from './mapper/room-invitation-link.mapper';

@ApiTags('Room')
@JwtAuthentication()
@Controller('rooms')
export class RoomController {
	constructor(private readonly roomUc: RoomUc, private readonly roomInvitationLinkUc: RoomInvitationLinkUc) {}

	@Get()
	@ApiOperation({ summary: 'Get a list of rooms.' })
	@ApiResponse({ status: HttpStatus.OK, description: 'Returns a list of rooms.', type: RoomListResponse })
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async getRooms(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() pagination: RoomPaginationParams
	): Promise<RoomListResponse> {
		const findOptions: IFindOptions<Room> = { pagination };

		const rooms = await this.roomUc.getRooms(currentUser.userId, findOptions);

		const response = RoomMapper.mapToRoomListResponse(rooms, pagination);

		return response;
	}

	@Post()
	@ApiOperation({ summary: 'Create a new room' })
	@ApiResponse({ status: HttpStatus.OK, description: 'Returns the details of a room', type: RoomItemResponse })
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async createRoom(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() createRoomParams: CreateRoomBodyParams
	): Promise<RoomItemResponse> {
		const room = await this.roomUc.createRoom(currentUser.userId, createRoomParams);

		const response = RoomMapper.mapToRoomItemResponse(room);

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
	public async getRoomDetails(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: RoomUrlParams
	): Promise<RoomDetailsResponse> {
		const { room, permissions } = await this.roomUc.getSingleRoom(currentUser.userId, urlParams.roomId);

		const response = RoomMapper.mapToRoomDetailsResponse(room, permissions);

		return response;
	}

	@Get(':roomId/boards')
	@ApiOperation({ summary: 'Get the boards of a room' })
	@ApiResponse({ status: HttpStatus.OK, description: 'Returns the boards of a room', type: RoomBoardListResponse })
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async getRoomBoards(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: RoomUrlParams
	): Promise<RoomBoardListResponse> {
		const boards = await this.roomUc.getRoomBoards(currentUser.userId, urlParams.roomId);

		const response = RoomMapper.mapToRoomBoardListResponse(boards);

		return response;
	}

	@Get('/:roomId/room-invitation-links')
	@ApiOperation({ summary: 'Get a list of room invitation links of a room.' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Returns a list of room invitation links.',
		type: RoomInvitationLinkListResponse,
	})
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async getInvitationLinks(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: RoomUrlParams
	): Promise<RoomInvitationLinkResponse[]> {
		const roomInvitationLinks = await this.roomInvitationLinkUc.listLinksByRoomId(currentUser.userId, urlParams.roomId);

		const response = RoomInvitationLinkMapper.mapToRoomInvitionLinksResponse(roomInvitationLinks);

		return response;
	}

	@Put(':roomId')
	@ApiOperation({ summary: 'Update an existing room' })
	@ApiResponse({ status: HttpStatus.OK, description: 'Returns the details of a room', type: RoomDetailsResponse })
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async updateRoom(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: RoomUrlParams,
		@Body() updateRoomParams: UpdateRoomBodyParams
	): Promise<RoomDetailsResponse> {
		const { room, permissions } = await this.roomUc.updateRoom(currentUser.userId, urlParams.roomId, updateRoomParams);

		const response = RoomMapper.mapToRoomDetailsResponse(room, permissions);

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
	@HttpCode(204)
	public async deleteRoom(@CurrentUser() currentUser: ICurrentUser, @Param() urlParams: RoomUrlParams): Promise<void> {
		await this.roomUc.deleteRoom(currentUser.userId, urlParams.roomId);
	}

	@Patch(':roomId/members/add')
	@ApiOperation({ summary: 'Add members to a room' })
	@ApiResponse({ status: HttpStatus.OK, description: 'Adding successful', type: RoomRoleResponse })
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async addMembers(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: RoomUrlParams,
		@Body() bodyParams: AddRoomMembersBodyParams
	): Promise<RoomRoleResponse> {
		const roomRole = await this.roomUc.addMembersToRoom(currentUser.userId, urlParams.roomId, bodyParams.userIds);
		const response = new RoomRoleResponse(roomRole);
		return response;
	}

	@Patch(':roomId/members/roles')
	@ApiOperation({ summary: 'Change the roles that members have within the room' })
	@ApiResponse({ status: HttpStatus.OK, description: 'Adding successful', type: String })
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async changeRolesOfMembers(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: RoomUrlParams,
		@Body() bodyParams: ChangeRoomRoleBodyParams
	): Promise<void> {
		await this.roomUc.changeRolesOfMembers(
			currentUser.userId,
			urlParams.roomId,
			bodyParams.userIds,
			bodyParams.roleName
		);
	}

	@Patch(':roomId/members/pass-ownership')
	@ApiOperation({
		summary:
			'Passes the ownership of the room to another user. Can only be used if you are the owner, and you will loose the ownership and become a roomadmin instead.',
	})
	@ApiResponse({ status: HttpStatus.OK, description: 'Adding successful', type: String })
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async changeRoomOwner(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: RoomUrlParams,
		@Body() bodyParams: PassOwnershipBodyParams
	): Promise<void> {
		await this.roomUc.passOwnership(currentUser.userId, urlParams.roomId, bodyParams.userId);
	}

	@Patch(':roomId/leave')
	@ApiOperation({ summary: 'Leaving a room' })
	@ApiResponse({ status: HttpStatus.OK, description: 'Removing successful', type: String })
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async leaveRoom(@CurrentUser() currentUser: ICurrentUser, @Param() urlParams: RoomUrlParams): Promise<void> {
		await this.roomUc.leaveRoom(currentUser.userId, urlParams.roomId);
	}

	@Patch(':roomId/members/remove')
	@ApiOperation({ summary: 'Remove members from a room' })
	@ApiResponse({ status: HttpStatus.OK, description: 'Removing successful', type: String })
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async removeMembers(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: RoomUrlParams,
		@Body() bodyParams: RemoveRoomMembersBodyParams
	): Promise<void> {
		await this.roomUc.removeMembersFromRoom(currentUser.userId, urlParams.roomId, bodyParams.userIds);
	}

	@Get(':roomId/members')
	@ApiOperation({ summary: 'Get a list of room members.' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Returns a list of the members of the room.',
		type: RoomMemberListResponse,
	})
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async getMembers(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: RoomUrlParams
	): Promise<RoomMemberListResponse> {
		const members = await this.roomUc.getRoomMembers(currentUser.userId, urlParams.roomId);
		const response = new RoomMemberListResponse(members);

		return Promise.resolve(response);
	}
}
