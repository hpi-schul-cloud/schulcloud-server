import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
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
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { BoardUc, ColumnUc } from '../uc';
import { CardResponse, ColumnUrlParams, MoveColumnBodyParams, RenameBodyParams } from './dto';
import { CreateCardBodyParams } from './dto/card/create-card.body.params';
import { CardResponseMapper } from './mapper';

@ApiTags('Board Column')
@JwtAuthentication()
@Controller('columns')
export class ColumnController {
	constructor(private readonly boardUc: BoardUc, private readonly columnUc: ColumnUc) {}

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
		await this.columnUc.updateColumnTitle(currentUser.userId, urlParams.columnId, bodyParams.title);
	}

	@ApiOperation({ summary: 'Delete a single column.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Delete(':columnId')
	async deleteColumn(@Param() urlParams: ColumnUrlParams, @CurrentUser() currentUser: ICurrentUser): Promise<void> {
		await this.columnUc.deleteColumn(currentUser.userId, urlParams.columnId);
	}

	@ApiOperation({ summary: 'Create a new card on a column.' })
	@ApiResponse({ status: 201, type: CardResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@ApiBody({ required: false, type: CreateCardBodyParams })
	@Post(':columnId/cards')
	async createCard(
		@Param() urlParams: ColumnUrlParams,
		@CurrentUser() currentUser: ICurrentUser,
		@Body() createCardBodyParams?: CreateCardBodyParams
	): Promise<CardResponse> {
		const { requiredEmptyElements } = createCardBodyParams || {};
		const card = await this.columnUc.createCard(currentUser.userId, urlParams.columnId, requiredEmptyElements);

		const response = CardResponseMapper.mapToResponse(card);

		return response;
	}
}
