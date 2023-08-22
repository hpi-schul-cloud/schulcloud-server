import { Controller, ForbiddenException, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiValidationError } from '@shared/common';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { CardUc } from '../uc';
import { ElementUc } from '../uc/element.uc';
import { SubmissionItemUc } from '../uc/submission-item.uc';
import { BoardSubmissionIdParams, SubmissionItemResponse } from './dto';
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
	async getSubmissionItems(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() urlParams: BoardSubmissionIdParams
	): Promise<SubmissionItemResponse[]> {
		const items = await this.submissionItemUc.findSubmissionItems(currentUser.userId, urlParams.submissionContainerId);
		const mapper = SubmissionItemResponseMapper.getInstance();
		return items.map((item) => mapper.mapToResponse(item));
	}
}
