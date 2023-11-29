import { Authenticate, CurrentUser, ICurrentUser } from '@modules/authentication';
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
import { CardUc, ColumnUc } from '../uc';
import {
	AnyContentElementResponse,
	CardIdsParams,
	CardListResponse,
	CardUrlParams,
	CreateContentElementBodyParams,
	ExternalToolElementResponse,
	FileElementResponse,
	LinkElementResponse,
	MoveCardBodyParams,
	RenameBodyParams,
	RichTextElementResponse,
	SubmissionContainerElementResponse,
} from './dto';
import { SetHeightBodyParams } from './dto/board/set-height.body.params';
import { CardResponseMapper, ContentElementResponseFactory } from './mapper';

@ApiTags('Board Card')
@Authenticate('jwt')
@Controller('cards')
export class CardController {
	constructor(private readonly columnUc: ColumnUc, private readonly cardUc: CardUc) {}

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
		await this.columnUc.moveCard(currentUser.userId, urlParams.cardId, bodyParams.toColumnId, bodyParams.toPosition);
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
		await this.cardUc.updateCardHeight(currentUser.userId, urlParams.cardId, bodyParams.height);
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
		await this.cardUc.updateCardTitle(currentUser.userId, urlParams.cardId, bodyParams.title);
	}

	@ApiOperation({ summary: 'Delete a single card.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Delete(':cardId')
	async deleteCard(@Param() urlParams: CardUrlParams, @CurrentUser() currentUser: ICurrentUser): Promise<void> {
		await this.cardUc.deleteCard(currentUser.userId, urlParams.cardId);
	}

	@ApiOperation({ summary: 'Create a new element on a card.' })
	@ApiExtraModels(
		ExternalToolElementResponse,
		FileElementResponse,
		LinkElementResponse,
		RichTextElementResponse,
		SubmissionContainerElementResponse
	)
	@ApiResponse({
		status: 201,
		schema: {
			oneOf: [
				{ $ref: getSchemaPath(ExternalToolElementResponse) },
				{ $ref: getSchemaPath(FileElementResponse) },
				{ $ref: getSchemaPath(LinkElementResponse) },
				{ $ref: getSchemaPath(RichTextElementResponse) },
				{ $ref: getSchemaPath(SubmissionContainerElementResponse) },
			],
		},
	})
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@Post(':cardId/elements')
	async createElement(
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
