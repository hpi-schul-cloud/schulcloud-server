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
} from '@nestjs/common';
import { ApiExtraModels, ApiOperation, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { CardUc } from '../uc';
import { ElementUc } from '../uc/element.uc';
import { SubmissionItemUc } from '../uc/submission-item.uc';
import {
	CreateContentElementBodyParams,
	FileElementResponse,
	RichTextElementResponse,
	SubmissionContainerUrlParams,
	SubmissionItemUrlParams,
	UpdateSubmissionItemBodyParams,
} from './dto';
import { SubmissionsResponse } from './dto/submission-item/submissions.response';
import { ContentElementResponseFactory, SubmissionItemResponseMapper } from './mapper';

@ApiTags('Board Submission')
@Authenticate('jwt')
@Controller('board-submissions')
export class BoardSubmissionController {
	constructor(
		private readonly cardUc: CardUc,
		private readonly elementUc: ElementUc,
		private readonly submissionItemUc: SubmissionItemUc
	) {}

	@ApiOperation({ summary: 'Get a list of submission items by their parent container.' })
	@ApiResponse({ status: 200, type: SubmissionsResponse })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@Get(':submissionContainerId')
	async getSubmissionItems(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: SubmissionContainerUrlParams
	): Promise<SubmissionsResponse> {
		const { submissionItems, users } = await this.submissionItemUc.findSubmissionItems(
			currentUser.userId,
			urlParams.submissionContainerId
		);
		const mapper = SubmissionItemResponseMapper.getInstance();
		const response = mapper.mapToResponse(submissionItems, users);

		return response;
	}

	@ApiOperation({ summary: 'Update a single submission item.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Patch(':submissionItemId')
	async updateSubmissionItem(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: SubmissionItemUrlParams,
		@Body() bodyParams: UpdateSubmissionItemBodyParams
	) {
		await this.submissionItemUc.updateSubmissionItem(
			currentUser.userId,
			urlParams.submissionItemId,
			bodyParams.completed
		);
	}

	@ApiOperation({ summary: 'Delete a single submission item.' })
	@ApiResponse({ status: 204 })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@HttpCode(204)
	@Delete(':submissionItemId')
	async deleteSubmissionItem(@CurrentUser() currentUser: ICurrentUser, @Param() urlParams: SubmissionItemUrlParams) {
		await this.submissionItemUc.deleteSubmissionItem(currentUser.userId, urlParams.submissionItemId);
	}

	@ApiOperation({ summary: 'Create a new element in a submission item.' })
	@ApiExtraModels(RichTextElementResponse, FileElementResponse)
	@ApiResponse({
		status: 201,
		schema: {
			oneOf: [{ $ref: getSchemaPath(RichTextElementResponse) }, { $ref: getSchemaPath(FileElementResponse) }],
		},
	})
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@ApiResponse({ status: 404, type: NotFoundException })
	@Post(':submissionItemId/elements')
	async createElement(
		@Param() urlParams: SubmissionItemUrlParams,
		@Body() bodyParams: CreateContentElementBodyParams,
		@CurrentUser() currentUser: ICurrentUser
	): Promise<FileElementResponse | RichTextElementResponse> {
		const { type } = bodyParams;
		const element = await this.submissionItemUc.createElement(currentUser.userId, urlParams.submissionItemId, type);
		const response = ContentElementResponseFactory.mapSubmissionContentToResponse(element);

		return response;
	}
}
