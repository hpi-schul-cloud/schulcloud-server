import { Body, Controller, ForbiddenException, Get, HttpCode, NotFoundException, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common/error/api-validation.error';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@src/modules/authentication/interface/user';
import { CardUc } from '../uc/card.uc';
import { ElementUc } from '../uc/element.uc';
import { SubmissionItemUc } from '../uc/submission-item.uc';
import { SubmissionContainerUrlParams } from './dto/submission-item/submission-container.url.params';
import { SubmissionItemUrlParams } from './dto/submission-item/submission-item.url.params';
import { SubmissionsResponse } from './dto/submission-item/submissions.response';
import { UpdateSubmissionItemBodyParams } from './dto/submission-item/update-submission-item.body.params';
import { SubmissionItemResponseMapper } from './mapper/submission-item-response.mapper';

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
}
