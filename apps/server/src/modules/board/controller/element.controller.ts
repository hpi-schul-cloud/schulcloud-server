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
import { ApiBody, ApiExtraModels, ApiOperation, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error/api-validation.error';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@src/modules/authentication/interface/user';
import { CardUc } from '../uc/card.uc';
import { ElementUc } from '../uc/element.uc';
import { ContentElementUrlParams } from './dto/board/content-element.url.params';
import { MoveContentElementBody } from './dto/card/move-content-element.body.params';
import { AnyContentElementResponse } from './dto/element/any-content-element.response';
import { ExternalToolElementResponse } from './dto/element/external-tool-element.response';
import { FileElementResponse } from './dto/element/file-element.response';
import { LinkElementResponse } from './dto/element/link-element.response';
import { RichTextElementResponse } from './dto/element/rich-text-element.response';
import { SubmissionContainerElementResponse } from './dto/element/submission-container-element.response';
import {
	ExternalToolElementContentBody,
	FileElementContentBody,
	LinkElementContentBody,
	RichTextElementContentBody,
	SubmissionContainerElementContentBody,
	UpdateElementContentBodyParams,
} from './dto/element/update-element-content.body.params';
import { CreateSubmissionItemBodyParams } from './dto/submission-item/create-submission-item.body.params';
import { SubmissionItemResponse } from './dto/submission-item/submission-item.response';
import { ContentElementResponseFactory } from './mapper/content-element-response.factory';
import { SubmissionItemResponseMapper } from './mapper/submission-item-response.mapper';

@ApiTags('Board Element')
@Authenticate('jwt')
@Controller('elements')
export class ElementController {
	constructor(private readonly cardUc: CardUc, private readonly elementUc: ElementUc) {}

	@ApiOperation({ summary: 'Move a single content element.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Put(':contentElementId/position')
	async moveElement(
		@Param() urlParams: ContentElementUrlParams,
		@Body() bodyParams: MoveContentElementBody,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.cardUc.moveElement(
			currentUser.userId,
			urlParams.contentElementId,
			bodyParams.toCardId,
			bodyParams.toPosition
		);
	}

	@ApiOperation({ summary: 'Update a single content element.' })
	@ApiExtraModels(
		FileElementContentBody,
		RichTextElementContentBody,
		SubmissionContainerElementContentBody,
		ExternalToolElementContentBody,
		LinkElementContentBody
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
	@HttpCode(201)
	@Patch(':contentElementId/content')
	async updateElement(
		@Param() urlParams: ContentElementUrlParams,
		@Body() bodyParams: UpdateElementContentBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<AnyContentElementResponse> {
		const element = await this.elementUc.updateElementContent(
			currentUser.userId,
			urlParams.contentElementId,
			bodyParams.data.content
		);
		const response = ContentElementResponseFactory.mapToResponse(element);
		return response;
	}

	@ApiOperation({ summary: 'Delete a single content element.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Delete(':contentElementId')
	async deleteElement(
		@Param() urlParams: ContentElementUrlParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<void> {
		await this.cardUc.deleteElement(currentUser.userId, urlParams.contentElementId);
	}

	@ApiOperation({ summary: 'Create a new submission item having parent a submission container element.' })
	@ApiExtraModels(SubmissionItemResponse)
	@ApiResponse({ status: 201, type: SubmissionItemResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@ApiBody({ required: true, type: CreateSubmissionItemBodyParams })
	@Post(':contentElementId/submissions')
	async createSubmissionItem(
		@Param() urlParams: ContentElementUrlParams,
		@Body() bodyParams: CreateSubmissionItemBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<SubmissionItemResponse> {
		const submissionItem = await this.elementUc.createSubmissionItem(
			currentUser.userId,
			urlParams.contentElementId,
			bodyParams.completed
		);
		const mapper = SubmissionItemResponseMapper.getInstance();
		const response = mapper.mapSubmissionsToResponse(submissionItem);

		return response;
	}
}
