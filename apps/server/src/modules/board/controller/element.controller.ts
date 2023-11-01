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
import { ApiValidationError } from '@shared/common';
import { ICurrentUser, Authenticate, CurrentUser } from '@modules/authentication';
import { CardUc } from '../uc';
import { ElementUc } from '../uc/element.uc';
import {
	AnyContentElementResponse,
	ContentElementUrlParams,
	CreateSubmissionItemBodyParams,
	ExternalToolElementContentBody,
	ExternalToolElementResponse,
	FileElementContentBody,
	FileElementResponse,
	LinkElementContentBody,
	LinkElementResponse,
	MoveContentElementBody,
	RichTextElementContentBody,
	RichTextElementResponse,
	SubmissionContainerElementContentBody,
	SubmissionContainerElementResponse,
	SubmissionItemResponse,
	UpdateElementContentBodyParams,
} from './dto';
import { ContentElementResponseFactory, SubmissionItemResponseMapper } from './mapper';

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
