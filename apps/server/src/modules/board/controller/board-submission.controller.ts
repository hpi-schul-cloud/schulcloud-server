import { Body, Controller, ForbiddenException, Get, HttpCode, NotFoundException, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { CardUc } from '../uc';
import { ElementUc } from '../uc/element.uc';
import { SubmissionItemUc } from '../uc/submission-item.uc';
import {
	SubmissionContainerUrlParams,
	SubmissionItemResponse,
	SubmissionItemUrlParams,
	UpdateSubmissionItemBodyParams,
	UserDataResponse,
} from './dto';
import { SubmissionItemResponseMapper } from './mapper';

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
	@ApiResponse({ status: 200, type: [SubmissionItemResponse] })
	@ApiResponse({ status: 400, type: ApiValidationError })
	@ApiResponse({ status: 403, type: ForbiddenException })
	@Get(':submissionContainerId')
	async getSubmissionItems(@CurrentUser() currentUser: ICurrentUser, @Param() urlParams: SubmissionContainerUrlParams) {
		const { submissionItems, users } = await this.submissionItemUc.findSubmissionItems(
			currentUser.userId,
			urlParams.submissionContainerId
		);
		const mapper = SubmissionItemResponseMapper.getInstance();
		const submissionItemsResponse: SubmissionItemResponse[] = submissionItems.map((item) => mapper.mapToResponse(item));
		const usersResponse: UserDataResponse[] = users.map((user) => mapper.mapUsersToResponse(user));

		return { submissionItemsResponse, users: usersResponse };
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
