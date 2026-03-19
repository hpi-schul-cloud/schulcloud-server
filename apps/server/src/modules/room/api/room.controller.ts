import { ErrorResponse } from '@core/error/dto';
import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { CopyApiResponse, CopyMapper } from '@modules/copy-helper';
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
import { RequestTimeout } from '@shared/common/decorators';
import { ApiValidationError } from '@shared/common/error';
import { IFindOptions } from '@shared/domain/interface';
import { Room } from '../domain';
import { ROOM_INCOMING_REQUEST_TIMEOUT_COPY_API_KEY } from '../timeout.config';
import { AddByEmailBodyParams } from './dto/request/add-by-email.body.params';
import { AddRoomMembersBodyParams } from './dto/request/add-room-members.body.params';
import { ChangeRoomRoleBodyParams } from './dto/request/change-room-role.body.params';
import { CreateRoomBodyParams } from './dto/request/create-room.body.params';
import { MoveItemBodyParams } from './dto/request/move-item.body.params';
import { PassOwnershipBodyParams } from './dto/request/pass-ownership.body.params';
import { RemoveRoomMembersBodyParams } from './dto/request/remove-room-members.body.params';
import { RoomPaginationParams } from './dto/request/room-pagination.params';
import { RoomUrlParams } from './dto/request/room.url.params';
import { UpdateRoomBodyParams } from './dto/request/update-room.body.params';
import { RoomBoardListResponse } from './dto/response/room-board-list.response';
import { RoomCreatedResponse } from './dto/response/room-created.response';
import { RoomDetailsResponse } from './dto/response/room-details.response';
import { RoomInvitationLinkListResponse } from './dto/response/room-invitation-link-list.response';
import { RoomListResponse } from './dto/response/room-list.response';
import { RoomMemberListResponse } from './dto/response/room-member-list.response';
import { RoomRoleResponse } from './dto/response/room-role.response';
import { RoomStatsListResponse } from './dto/response/room-stats-list.repsonse';
import { RoomInvitationLinkMapper } from './mapper/room-invitation-link.mapper';
import { RoomMapper } from './mapper/room.mapper';
import { RoomArrangementUc } from './room-arrangement.uc';
import { RoomContentUc } from './room-content.uc';
import { RoomCopyUc } from './room-copy.uc';
import { RoomInvitationLinkUc } from './room-invitation-link.uc';
import { RoomUc } from './room.uc';

@ApiTags('Room')
@JwtAuthentication()
@Controller('rooms')
export class RoomController {
	constructor(
		private readonly roomUc: RoomUc,
		private readonly roomArrangementUc: RoomArrangementUc,
		private readonly roomContentUc: RoomContentUc,
		private readonly roomCopyUc: RoomCopyUc,
		private readonly roomInvitationLinkUc: RoomInvitationLinkUc
	) {}

	@Get()
	@ApiOperation({ summary: 'Get a list of rooms.' })
	@ApiResponse({ status: HttpStatus.OK, description: 'Returns a list of rooms.', type: RoomListResponse })
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async getRooms(@CurrentUser() currentUser: ICurrentUser): Promise<RoomListResponse> {
		const rooms = await this.roomArrangementUc.getRoomsByUserArrangement(currentUser.userId);

		const response = RoomMapper.mapToRoomListResponse(rooms);

		return response;
	}

	@ApiOperation({ summary: 'Move a single room item.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Patch('')
	public async moveRoom(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() bodyParams: MoveItemBodyParams
	): Promise<void> {
		await this.roomArrangementUc.moveRoomInUserArrangement(currentUser.userId, bodyParams.id, bodyParams.toPosition);
	}

	@Get('stats')
	@ApiOperation({ summary: 'Get a list of room statistics.' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Returns a list of room statistics.',
		type: RoomStatsListResponse,
	})
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async getRoomStats(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() pagination: RoomPaginationParams
	): Promise<RoomStatsListResponse> {
		const findOptions: IFindOptions<Room> = { pagination };

		const roomStats = await this.roomUc.getRoomStats(currentUser.userId, findOptions);

		const response = RoomMapper.mapToRoomStatsListResponse(roomStats, pagination);

		return response;
	}

	@Post()
	@ApiOperation({ summary: 'Create a new room' })
	@ApiResponse({ status: HttpStatus.CREATED, type: RoomCreatedResponse })
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async createRoom(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() createRoomParams: CreateRoomBodyParams
	): Promise<RoomCreatedResponse> {
		const room = await this.roomUc.createRoom(currentUser.userId, createRoomParams);

		const response = RoomMapper.mapToRoomCreatedResponse(room);

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
		const { room, allowedOperations } = await this.roomUc.getSingleRoom(currentUser.userId, urlParams.roomId);

		const response = RoomMapper.mapToRoomDetailsResponse(room, allowedOperations);

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
		const boards = await this.roomContentUc.getRoomBoards(currentUser.userId, urlParams.roomId);

		const response = RoomMapper.mapToRoomBoardListResponse(boards);

		return response;
	}

	@ApiOperation({ summary: 'Move a single board item.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Patch(':roomId/boards')
	public async moveBoard(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: RoomUrlParams,
		@Body() bodyParams: MoveItemBodyParams
	): Promise<void> {
		await this.roomContentUc.moveBoard(currentUser.userId, urlParams.roomId, bodyParams.id, bodyParams.toPosition);
	}

	@Get(':roomId/room-invitation-links')
	@ApiOperation({ summary: 'Get the list of room invitation links of a room.' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Returns the list of room invitation links.',
		type: RoomInvitationLinkListResponse,
	})
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async getInvitationLinks(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: RoomUrlParams
	): Promise<RoomInvitationLinkListResponse> {
		const roomInvitationLinks = await this.roomInvitationLinkUc.listLinksByRoomId(currentUser.userId, urlParams.roomId);

		const response = RoomInvitationLinkMapper.mapToRoomInvitationLinkListResponse(roomInvitationLinks);

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
		const { room, allowedOperations } = await this.roomUc.updateRoom(
			currentUser.userId,
			urlParams.roomId,
			updateRoomParams
		);

		const response = RoomMapper.mapToRoomDetailsResponse(room, allowedOperations);

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

	@Patch(':roomId/members/add-by-email')
	@ApiOperation({ summary: 'Add external person to room or trigger registration' })
	@ApiResponse({ status: HttpStatus.OK, description: 'Patching successful', type: RoomRoleResponse })
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async addByEmail(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: RoomUrlParams,
		@Body() bodyParams: AddByEmailBodyParams
	): Promise<RoomRoleResponse | void> {
		const roomRole = await this.roomUc.addExternalPersonByEmailToRoom(
			currentUser.userId,
			urlParams.roomId,
			bodyParams.email
		);
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

	@Get(':roomId/members-redacted')
	@ApiOperation({ summary: 'Get a list of room members for admins where names are partially redacted.' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Returns a list of the members of the room.',
		type: RoomMemberListResponse,
	})
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async getMembersRedacted(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: RoomUrlParams
	): Promise<RoomMemberListResponse> {
		const members = await this.roomUc.getRoomMembersRedacted(currentUser.userId, urlParams.roomId);
		const response = new RoomMemberListResponse(members);

		return Promise.resolve(response);
	}

	@Post(':roomId/copy')
	@ApiOperation({
		summary: 'Creates a copy of the given room. Restricted to Room Owner and Admin',
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Returns the copy status of a duplicated room',
		type: CopyApiResponse,
	})
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	@RequestTimeout(ROOM_INCOMING_REQUEST_TIMEOUT_COPY_API_KEY)
	public async copyRoom(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: RoomUrlParams
	): Promise<CopyApiResponse> {
		const copyStatus = await this.roomCopyUc.copyRoom(currentUser.userId, urlParams.roomId);

		const copyResponse = CopyMapper.mapToResponse(copyStatus);

		return copyResponse;
	}
}
