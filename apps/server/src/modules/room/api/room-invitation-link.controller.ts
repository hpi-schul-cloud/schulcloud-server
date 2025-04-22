import { ErrorResponse } from '@core/error/dto';
import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import {
	Body,
	Controller,
	Delete,
	ForbiddenException,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	Post,
	Put,
	UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error';
import { CreateRoomInvitationLinkBodyParams } from './dto/request/create-room-invitation-link.body.params';
import { RoomInvitationLinkUrlParams } from './dto/request/room-invitation-link.url.params';
import { UpdateRoomInvitationLinkBodyParams } from './dto/request/update-room-invitation-link.body.params';
import { RoomInvitationLinkUseLinkResponse } from './dto/response/room-invitation-link-use-link.response';
import { RoomInvitationLinkResponse } from './dto/response/room-invitation-link.response';
import { RoomInvitationLinkMapper } from './mapper/room-invitation-link.mapper';
import { RoomInvitationLinkUc } from './room-invitation-link.uc';

@ApiTags('Room-Invitation-Links')
@JwtAuthentication()
@Controller('room-invitation-links')
export class RoomInvitationLinkController {
	constructor(private readonly roomInvitationLinkUc: RoomInvitationLinkUc) {}

	@Post()
	@ApiOperation({ summary: 'Create a new room invitation link' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Returns a new room invitation link',
		type: RoomInvitationLinkResponse,
	})
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async createRoomInvitationLink(
		@CurrentUser() currentUser: ICurrentUser,
		@Body() createRoomParams: CreateRoomInvitationLinkBodyParams
	): Promise<RoomInvitationLinkResponse> {
		const roomInvitationLink = await this.roomInvitationLinkUc.createLink(currentUser.userId, createRoomParams);

		const response = RoomInvitationLinkMapper.mapToRoomInvitionLinkResponse(roomInvitationLink);

		return response;
	}

	@Put(':roomInvitationLinkId')
	@ApiOperation({ summary: 'Update an existing room invitation link' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Returns the updated room invitation link',
		type: RoomInvitationLinkResponse,
	})
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async updateLink(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: RoomInvitationLinkUrlParams,
		@Body() updateRoomParams: UpdateRoomInvitationLinkBodyParams
	): Promise<RoomInvitationLinkResponse> {
		const roomInvitationLink = await this.roomInvitationLinkUc.updateLink(currentUser.userId, {
			id: urlParams.roomInvitationLinkId,
			...updateRoomParams,
		});

		const response = RoomInvitationLinkMapper.mapToRoomInvitionLinkResponse(roomInvitationLink);

		return response;
	}

	@Delete(':roomInvitationLinkId')
	@ApiOperation({ summary: 'Delete a room invitation link' })
	@ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Deletion successful' })
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: HttpStatus.NOT_FOUND, type: NotFoundException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	@HttpCode(204)
	public async deleteLink(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: RoomInvitationLinkUrlParams
	): Promise<void> {
		await this.roomInvitationLinkUc.deleteLink(currentUser.userId, urlParams.roomInvitationLinkId);
	}

	@Post(':roomInvitationLinkId')
	@ApiOperation({ summary: 'Use a room invitation link to join a room' })
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Returns the redirect URL or an error cause.',
		type: RoomInvitationLinkUseLinkResponse,
	})
	@ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiValidationError })
	@ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedException })
	@ApiResponse({ status: HttpStatus.FORBIDDEN, type: ForbiddenException })
	@ApiResponse({ status: '5XX', type: ErrorResponse })
	public async useLink(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: RoomInvitationLinkUrlParams
	): Promise<RoomInvitationLinkUseLinkResponse> {
		const result = await this.roomInvitationLinkUc.useLink(currentUser.userId, urlParams.roomInvitationLinkId);

		return result;
	}
}
