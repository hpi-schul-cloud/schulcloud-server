import {
	Body,
	Controller,
	Delete,
	ForbiddenException,
	HttpCode,
	NotFoundException,
	Param,
	Patch,
	Post,
	Put,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { BoardUc } from '../uc';
import { CardResponse, ColumnUrlParams, MoveColumnBodyParams, RenameBodyParams } from './dto';
import { CardResponseMapper } from './mapper';
import { CreateCardBodyParams } from './dto/card/create-card.body.params';

@ApiTags('Board Column')
@Authenticate('jwt')
@Controller('columns')
export class ColumnController {
	constructor(private readonly boardUc: BoardUc) {}

	@ApiOperation({ summary: 'Move a single column.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Put(':columnId/position')
	async moveColumn(
		@Param() urlParams: ColumnUrlParams,
		@Body() bodyParams: MoveColumnBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.boardUc.moveColumn(currentUser.userId, urlParams.columnId, bodyParams.toBoardId, bodyParams.toPosition);
	}

	@ApiOperation({ summary: 'Update the title of a single column.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Patch(':columnId/title')
	async updateColumnTitle(
		@Param() urlParams: ColumnUrlParams,
		@Body() bodyParams: RenameBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.boardUc.updateColumnTitle(currentUser.userId, urlParams.columnId, bodyParams.title);
	}

	@ApiOperation({ summary: 'Delete a single column.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Delete(':columnId')
	async deleteColumn(@Param() urlParams: ColumnUrlParams, @CurrentUser() currentUser: ICurrentUser): Promise<void> {
		await this.boardUc.deleteColumn(currentUser.userId, urlParams.columnId);
	}

	@ApiOperation({ summary: 'Create a new card on a column.' })
	@ApiResponse({ status: 201, type: CardResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@Post(':columnId/cards')
	async createCard(
		@Param() urlParams: ColumnUrlParams,
		@CurrentUser() currentUser: ICurrentUser,
		@Body() createCardBodyParams?: CreateCardBodyParams | undefined
	): Promise<CardResponse> {
		const card = await this.boardUc.createCard(currentUser.userId, urlParams.columnId, createCardBodyParams);

		const response = CardResponseMapper.mapToResponse(card);

		return response;
	}
}
