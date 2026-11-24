import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { ErrorResponse } from '@infra/error';
import {
	Body,
	Controller,
	Delete,
	ForbiddenException,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post,
	UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error';
import { CreateRoomGroupBodyParams } from './dto/request/create-room-group.body.params';
import { DeleteRoomGroupBodyParams } from './dto/request/delete-room-group.body.params';
import { MoveRoomInArrangementBodyParams } from './dto/request/move-room-in-arrangement.body.params';
import { MoveRoomsInArrangementBodyParams } from './dto/request/move-rooms-in-arrangement.body.params';
import { UpdateRoomGroupsCollapsedBodyParams } from './dto/request/update-room-groups-collapsed.body.params';
import { RoomGroupUrlParams } from './dto/request/room-group.url.params';
import { UpdateRoomArrangementPreferencesBodyParams } from './dto/request/update-room-arrangement-preferences.body.params';
import { UpdateRoomGroupOrderBodyParams } from './dto/request/update-room-group-order.body.params';
import { UpdateRoomGroupBodyParams } from './dto/request/update-room-group.body.params';
import { RoomArrangementResponse, RoomGroupCreatedResponse } from './dto/response/room-arrangement.response';
import { RoomArrangementMapper } from './mapper/room-arrangement.mapper';
import { RoomArrangementUc } from './room-arrangement.uc';

@ApiTags('Room Arrangement')
@JwtAuthentication()
@Controller('room-arrangements/me')
export class RoomArrangementController {
	constructor(private readonly roomArrangementUc: RoomArrangementUc) {}

	@Get()
	@ApiOperation({ summary: 'Get the personal room arrangement (groups and order) of the current user.' })
	@ApiResponse({ status: HttpStatus.OK, type: RoomArrangementResponse })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async getArrangement(@CurrentUser() currentUser: ICurrentUser): Promise<RoomArrangementResponse> {
		const arrangement = await this.roomArrangementUc.getArrangement(currentUser.userId);

		const response = RoomArrangementMapper.mapToRoomArrangementResponse(arrangement);

		return response;
	}

	@Post('groups')
	@ApiOperation({ summary: 'Create an empty room group at the end of the group list.' })
	@ApiResponse({ status: HttpStatus.CREATED, type: RoomGroupCreatedResponse })
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponse })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async createGroup(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() bodyParams: CreateRoomGroupBodyParams
	): Promise<RoomGroupCreatedResponse> {
		const arrangement = await this.roomArrangementUc.createGroup(
			currentUser.userId,
			bodyParams.expectedRevision,
			bodyParams.name
		);

		const response = RoomArrangementMapper.mapToRoomGroupCreatedResponse(arrangement);

		return response;
	}

	@Patch('groups/:groupId')
	@ApiOperation({ summary: 'Rename a room group and/or change its collapsed state.' })
	@ApiResponse({ status: HttpStatus.OK, type: RoomArrangementResponse })
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
	@ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponse })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async updateGroup(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: RoomGroupUrlParams,
		@Body() bodyParams: UpdateRoomGroupBodyParams
	): Promise<RoomArrangementResponse> {
		const arrangement = await this.roomArrangementUc.updateGroup(
			currentUser.userId,
			bodyParams.expectedRevision,
			urlParams.groupId,
			{ name: bodyParams.name, collapsed: bodyParams.collapsed }
		);

		const response = RoomArrangementMapper.mapToRoomArrangementResponse(arrangement);

		return response;
	}

	@Delete('groups/:groupId')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: 'Delete a room group. Its rooms are appended to the ungrouped rooms; rooms are never deleted.',
	})
	@ApiResponse({ status: HttpStatus.OK, type: RoomArrangementResponse })
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
	@ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponse })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async deleteGroup(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: RoomGroupUrlParams,
		@Body() bodyParams: DeleteRoomGroupBodyParams
	): Promise<RoomArrangementResponse> {
		const arrangement = await this.roomArrangementUc.deleteGroup(
			currentUser.userId,
			bodyParams.expectedRevision,
			urlParams.groupId,
			bodyParams.disableFutureConfirmation ?? false
		);

		const response = RoomArrangementMapper.mapToRoomArrangementResponse(arrangement);

		return response;
	}

	@Patch('group-order')
	@ApiOperation({ summary: 'Change the order of all room groups.' })
	@ApiResponse({ status: HttpStatus.OK, type: RoomArrangementResponse })
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponse })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async updateGroupOrder(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() bodyParams: UpdateRoomGroupOrderBodyParams
	): Promise<RoomArrangementResponse> {
		const arrangement = await this.roomArrangementUc.updateGroupOrder(
			currentUser.userId,
			bodyParams.expectedRevision,
			bodyParams.groupIds
		);

		const response = RoomArrangementMapper.mapToRoomArrangementResponse(arrangement);

		return response;
	}

	@Patch('room-position')
	@ApiOperation({
		summary: 'Move a room within its section or into another section. A null group id means the ungrouped rooms.',
	})
	@ApiResponse({ status: HttpStatus.OK, type: RoomArrangementResponse })
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
	@ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponse })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async moveRoom(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() bodyParams: MoveRoomInArrangementBodyParams
	): Promise<RoomArrangementResponse> {
		const arrangement = await this.roomArrangementUc.moveRoomToPosition(
			currentUser.userId,
			bodyParams.expectedRevision,
			{
				roomId: bodyParams.roomId,
				sourceGroupId: bodyParams.sourceGroupId,
				targetGroupId: bodyParams.targetGroupId,
				beforeRoomId: bodyParams.beforeRoomId,
			}
		);

		const response = RoomArrangementMapper.mapToRoomArrangementResponse(arrangement);

		return response;
	}

	@Patch('group-collapse')
	@ApiOperation({ summary: 'Collapse or expand all room groups at once.' })
	@ApiResponse({ status: HttpStatus.OK, type: RoomArrangementResponse })
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponse })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async updateGroupsCollapsed(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() bodyParams: UpdateRoomGroupsCollapsedBodyParams
	): Promise<RoomArrangementResponse> {
		const arrangement = await this.roomArrangementUc.updateGroupsCollapsed(
			currentUser.userId,
			bodyParams.expectedRevision,
			bodyParams.collapsed
		);

		const response = RoomArrangementMapper.mapToRoomArrangementResponse(arrangement);

		return response;
	}

	@Patch('room-positions')
	@ApiOperation({
		summary: 'Move several rooms at once to the end of a section. A null group id means the ungrouped rooms.',
	})
	@ApiResponse({ status: HttpStatus.OK, type: RoomArrangementResponse })
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: HttpStatus.NOT_FOUND, type: ErrorResponse })
	@ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponse })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async moveRooms(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() bodyParams: MoveRoomsInArrangementBodyParams
	): Promise<RoomArrangementResponse> {
		const arrangement = await this.roomArrangementUc.moveRoomsToSection(
			currentUser.userId,
			bodyParams.expectedRevision,
			bodyParams.roomIds,
			bodyParams.targetGroupId
		);

		const response = RoomArrangementMapper.mapToRoomArrangementResponse(arrangement);

		return response;
	}

	@Patch('preferences')
	@ApiOperation({ summary: 'Change the personal preferences of the room arrangement.' })
	@ApiResponse({ status: HttpStatus.OK, type: RoomArrangementResponse })
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: HttpStatus.CONFLICT, type: ErrorResponse })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async updatePreferences(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() bodyParams: UpdateRoomArrangementPreferencesBodyParams
	): Promise<RoomArrangementResponse> {
		const arrangement = await this.roomArrangementUc.updatePreferences(
			currentUser.userId,
			bodyParams.expectedRevision,
			bodyParams.confirmGroupDeletion
		);

		const response = RoomArrangementMapper.mapToRoomArrangementResponse(arrangement);

		return response;
	}
}
