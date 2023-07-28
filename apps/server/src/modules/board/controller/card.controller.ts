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
import { ApiValidationError } from '@shared/common';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { BoardUc, CardUc } from '../uc';
import {
	AnyContentElementResponse,
	CardIdsParams,
	CardListResponse,
	CardUrlParams,
	CreateContentElementBodyParams,
	FileElementResponse,
	MoveCardBodyParams,
	RenameBodyParams,
	SubmissionContainerElementResponse,
} from './dto';
import { SetHeightBodyParams } from './dto/board/set-height.body.params';
import { RichTextElementResponse } from './dto/element/rich-text-element.response';
import { CardResponseMapper, ContentElementResponseFactory } from './mapper';

@ApiTags('Board Card')
@Authenticate('jwt')
@Controller('cards')
export class CardController {
	constructor(private readonly boardUc: BoardUc, private readonly cardUc: CardUc) {}

	@ApiOperation({ summary: 'Get a list of cards by their ids.' })
	@ApiResponse({ status: 200, type: CardListResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@Get()
	async getCards(
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
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Put(':cardId/position')
	async moveCard(
		@Param() urlParams: CardUrlParams,
		@Body() bodyParams: MoveCardBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.boardUc.moveCard(currentUser.userId, urlParams.cardId, bodyParams.toColumnId, bodyParams.toPosition);
	}

	@ApiOperation({ summary: 'Update the height of a single card.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Patch(':cardId/height')
	async updateCardHeight(
		@Param() urlParams: CardUrlParams,
		@Body() bodyParams: SetHeightBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.boardUc.updateCardHeight(currentUser.userId, urlParams.cardId, bodyParams.height);
	}

	@ApiOperation({ summary: 'Update the title of a single card.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Patch(':cardId/title')
	async updateCardTitle(
		@Param() urlParams: CardUrlParams,
		@Body() bodyParams: RenameBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.boardUc.updateCardTitle(currentUser.userId, urlParams.cardId, bodyParams.title);
	}

	@ApiOperation({ summary: 'Delete a single card.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Delete(':cardId')
	async deleteCard(@Param() urlParams: CardUrlParams, @CurrentUser() currentUser: ICurrentUser): Promise<void> {
		await this.boardUc.deleteCard(currentUser.userId, urlParams.cardId);
	}

	@ApiOperation({ summary: 'Create a new element on a card.' })
	@ApiExtraModels(RichTextElementResponse, FileElementResponse, SubmissionContainerElementResponse)
	@ApiResponse({
		status: 201,
		schema: {
			oneOf: [
				{ $ref: getSchemaPath(RichTextElementResponse) },
				{ $ref: getSchemaPath(FileElementResponse) },
				{ $ref: getSchemaPath(SubmissionContainerElementResponse) },
			],
		},
	})
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@Post(':cardId/elements')
	async createElement(
		@Param() urlParams: CardUrlParams, // TODO add type-property ?
		@Body() bodyParams: CreateContentElementBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<AnyContentElementResponse> {
		const { type, toPosition } = bodyParams;
		const element = await this.cardUc.createElement(currentUser.userId, urlParams.cardId, type, toPosition);
		const response = ContentElementResponseFactory.mapToResponse(element);

		return response;
	}
}
