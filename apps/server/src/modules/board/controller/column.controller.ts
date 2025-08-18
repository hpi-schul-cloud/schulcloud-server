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
import { ApiBody, ApiExtraModels, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error';
import { BoardUc, ColumnUc } from '../uc';
import { CardResponse, ColumnUrlParams, MoveColumnBodyParams, RenameBodyParams } from './dto';
import {
	ExternalToolElementResponse,
	FileElementResponse,
	LinkElementResponse,
	RichTextElementResponse,
	SubmissionContainerElementResponse,
	DrawingElementResponse,
	CollaborativeTextEditorElementResponse,
	DeletedElementResponse,
	VideoConferenceElementResponse,
	FileFolderElementResponse,
	H5pElementResponse,
	UpdateElementContentBodyParams,
	DrawingElementContentBody,
	ExternalToolElementContentBody,
	FileElementContentBody,
	FileFolderElementContentBody,
	H5pElementContentBody,
	LinkElementContentBody,
	RichTextElementContentBody,
	SubmissionContainerElementContentBody,
	VideoConferenceElementContentBody,
	DrawingContentBody,
	ExternalToolContentBody,
	FileContentBody,
	FileFolderContentBody,
	H5pContentBody,
	LinkContentBody,
	RichTextContentBody,
	SubmissionContainerContentBody,
	VideoConferenceContentBody,
} from './dto/element';
import { CreateCardBodyParams } from './dto/card/create-card.body.params';
import { CardResponseMapper } from './mapper';
import { CardContentUc } from '../uc/card-content.uc';

import { CreateCardImportBodyParams } from './dto/card/create-card.import.body.params';


@ApiTags('Board Column')
@JwtAuthentication()
@Controller('columns')
export class ColumnController {
	constructor(
		private readonly boardUc: BoardUc,
		private readonly columnUc: ColumnUc,
		private readonly cardContentUc: CardContentUc
	) {}

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

	@ApiOperation({ summary: 'Create a new card on a column with content.', operationId: 'ColumnController_createCardWithContent' })
	@ApiResponse({ status: 201, type: CardResponse })
	@ApiExtraModels(
	ExternalToolElementResponse,
	FileElementResponse,
	LinkElementResponse,
	RichTextElementResponse,
	SubmissionContainerElementResponse,
	DrawingElementResponse,
	CollaborativeTextEditorElementResponse,
	DeletedElementResponse,
	VideoConferenceElementResponse,
	FileFolderElementResponse,
	H5pElementResponse,
	UpdateElementContentBodyParams,
	FileElementContentBody,
	LinkElementContentBody,
	RichTextElementContentBody,
	SubmissionContainerElementContentBody,
	ExternalToolElementContentBody,
	VideoConferenceElementContentBody,
	FileFolderElementContentBody,
	H5pElementContentBody,
	DrawingElementContentBody,
	FileContentBody,
	DrawingContentBody,
	LinkContentBody,
	RichTextContentBody,
	SubmissionContainerContentBody,
	ExternalToolContentBody,
	VideoConferenceContentBody,
	FileFolderContentBody,
	H5pContentBody
	)
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@Post(':columnId/cardsContent')
	public async createCardWithContent(
		@Param() urlParams: ColumnUrlParams,
		@CurrentUser() currentUser: ICurrentUser,
		@Body() createCardBodyParams: CreateCardImportBodyParams
	): Promise<CardResponse> {
		const cardTitle = createCardBodyParams.cardTitle ? createCardBodyParams.cardTitle : '';
		const cardElements = createCardBodyParams.cardElements ?? [];
		const response = await this.cardContentUc.createCardWithContent(
			currentUser.userId,
			urlParams.columnId,
			cardElements,
			cardTitle
		);

		return response;
	}
}
