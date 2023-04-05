import { Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { BoardUc } from '../uc';
import { CardResponse, ColumnUrlParams, MoveColumnBodyParams, RenameBodyParams } from './dto';
import { CardResponseMapper } from './mapper';

@ApiTags('Columns')
@Authenticate('jwt')
@Controller('columns')
export class ColumnController {
	constructor(private readonly boardUc: BoardUc) {}

	@Put(':columnId/position')
	async moveColumn(
		@Param() urlParams: ColumnUrlParams,
		@Body() bodyParams: MoveColumnBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<boolean> {
		await this.boardUc.moveColumn(currentUser.userId, urlParams.columnId, bodyParams.toBoardId, bodyParams.toPosition);

		return true;
	}

	@Put(':columnId/title')
	async renameColumn(
		@Param() urlParams: ColumnUrlParams,
		@Body() bodyParams: RenameBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.boardUc.updateColumnTitle(currentUser.userId, urlParams.columnId, bodyParams.title);
	}

	@Delete(':columnId')
	async deleteColumn(@Param() urlParams: ColumnUrlParams, @CurrentUser() currentUser: ICurrentUser): Promise<boolean> {
		await this.boardUc.deleteColumn(currentUser.userId, urlParams.columnId);

		return true;
	}

	@Post(':columnId/cards')
	async createCard(
		@Param() urlParams: ColumnUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<CardResponse> {
		const card = await this.boardUc.createCard(currentUser.userId, urlParams.columnId);

		const response = CardResponseMapper.mapToResponse(card);

		return response;
	}
}
