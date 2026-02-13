import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import {
	Body,
	Controller,
	Delete,
	ForbiddenException,
	Get,
	HttpCode,
	NotFoundException,
	Param,
	Patch,
	Post,
	Put,
	Query,
} from '@nestjs/common';
import { ApiExtraModels, ApiOperation, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { RequestTimeout } from '@shared/common/decorators';
import { ApiValidationError } from '@shared/common/error';
import { BOARD_INCOMING_REQUEST_TIMEOUT_COPY_API_KEY } from '../timeout.config';
import { CardUc, ColumnUc } from '../uc';
import {
	AnyContentElementResponse,
	CardIdsParams,
	CardListResponse,
	CardResponse,
	CardUrlParams,
	CreateContentElementBodyParams,
	DeletedElementResponse,
	DrawingElementResponse,
	ExternalToolElementResponse,
	FileElementResponse,
	FileFolderElementResponse,
	H5pElementResponse,
	LinkElementResponse,
	MoveCardBodyParams,
	RenameBodyParams,
	RichTextElementResponse,
	SubmissionContainerElementResponse,
	VideoConferenceElementResponse,
} from './dto';
import { MoveCardResponse } from './dto/board/move-card.response';
import { SetHeightBodyParams } from './dto/board/set-height.body.params';
import { CardResponseMapper, ContentElementResponseFactory } from './mapper';
import { MoveCardResponseMapper } from './mapper/move-card-response.mapper';

@ApiTags('Board Card')
@JwtAuthentication()
@Controller('cards')
export class CardController {
	constructor(private readonly columnUc: ColumnUc, private readonly cardUc: CardUc) {}

	@ApiOperation({ summary: 'Get a list of cards by their ids.' })
	@ApiResponse({ status: 200, type: CardListResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@Get()
	public async getCards(
		@CurrentUser() currentUser: ICurrentUser,
		@Query() cardIdParams: CardIdsParams
	): Promise<CardListResponse> {
		const cardIds = Array.isArray(cardIdParams.ids) ? cardIdParams.ids : [cardIdParams.ids];
		const cards = await this.cardUc.findCards(currentUser.userId, cardIds);
		const cardResponses = cards.map((card) => CardResponseMapper.mapToResponse(card));

		const result = new CardListResponse({
			data: cardResponses,
		});
		return result;
	}

	@ApiOperation({ summary: 'Move a single card.' })
	@ApiResponse({ status: 204, type: MoveCardResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@Put(':cardId/position')
	public async moveCard(
		@Param() urlParams: CardUrlParams,
		@Body() bodyParams: MoveCardBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<MoveCardResponse> {
		const data = await this.columnUc.moveCard(
			currentUser.userId,
			urlParams.cardId,
			bodyParams.toColumnId,
			bodyParams.toPosition
		);
		const result = MoveCardResponseMapper.mapToReponse(data);

		return result;
	}

	@ApiOperation({ summary: 'Update the height of a single card.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Patch(':cardId/height')
	public async updateCardHeight(
		@Param() urlParams: CardUrlParams,
		@Body() bodyParams: SetHeightBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.cardUc.updateCardHeight(currentUser.userId, urlParams.cardId, bodyParams.height);
	}

	@ApiOperation({ summary: 'Update the title of a single card.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Patch(':cardId/title')
	public async updateCardTitle(
		@Param() urlParams: CardUrlParams,
		@Body() bodyParams: RenameBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.cardUc.updateCardTitle(currentUser.userId, urlParams.cardId, bodyParams.title);
	}

	@ApiOperation({ summary: 'Delete a single card.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Delete(':cardId')
	public async deleteCard(@Param() urlParams: CardUrlParams, @CurrentUser() currentUser: ICurrentUser): Promise<void> {
		await this.cardUc.deleteCard(currentUser.userId, urlParams.cardId);
	}

	@ApiOperation({ summary: 'Copy a single card.' })
	@ApiResponse({ status: 201, type: CardResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@Post(':cardId/copy')
	@RequestTimeout(BOARD_INCOMING_REQUEST_TIMEOUT_COPY_API_KEY)
	public async copyCard(
		@Param() urlParams: CardUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<CardResponse> {
		const copiedCard = await this.columnUc.copyCard(currentUser.userId, urlParams.cardId, currentUser.schoolId);
		const cardDto = CardResponseMapper.mapToResponse(copiedCard);
		return cardDto;
	}

	@ApiOperation({ summary: 'Create a new element on a card.' })
	@ApiExtraModels(
		ExternalToolElementResponse,
		FileElementResponse,
		FileFolderElementResponse,
		LinkElementResponse,
		RichTextElementResponse,
		SubmissionContainerElementResponse,
		DrawingElementResponse,
		DeletedElementResponse,
		VideoConferenceElementResponse,
		H5pElementResponse
	)
	@ApiResponse({
		status: 201,
		schema: {
			oneOf: [
				{ $ref: getSchemaPath(ExternalToolElementResponse) },
				{ $ref: getSchemaPath(FileElementResponse) },
				{ $ref: getSchemaPath(FileFolderElementResponse) },
				{ $ref: getSchemaPath(LinkElementResponse) },
				{ $ref: getSchemaPath(RichTextElementResponse) },
				{ $ref: getSchemaPath(SubmissionContainerElementResponse) },
				{ $ref: getSchemaPath(DrawingElementResponse) },
				{ $ref: getSchemaPath(DeletedElementResponse) },
				{ $ref: getSchemaPath(VideoConferenceElementResponse) },
				{ $ref: getSchemaPath(H5pElementResponse) },
			],
		},
	})
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@Post(':cardId/elements')
	public async createElement(
		@Param() urlParams: CardUrlParams,
		@Body() bodyParams: CreateContentElementBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<AnyContentElementResponse> {
		const { type, toPosition } = bodyParams;
		const element = await this.cardUc.createElement(currentUser.userId, urlParams.cardId, type, toPosition);
		const response = ContentElementResponseFactory.mapToResponse(element);

		return response;
	}
}
