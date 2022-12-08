import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { SubmissionMapper } from '../mapper';
import { SubmissionUc } from '../uc';
import { TaskUrlParams } from './dto';
import { SubmissionStatusListResponse } from './dto/submission.response';

@ApiTags('Submission')
@Authenticate('jwt')
@Controller('submissions')
export class SubmissionController {
	constructor(private readonly submissionUc: SubmissionUc) {}

	@Get('status/task/:taskId')
	async findStatusesByTask(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: TaskUrlParams
	): Promise<SubmissionStatusListResponse> {
		const submissions = await this.submissionUc.findAllByTask(currentUser.userId, params.taskId);

		const submissionResponses = submissions.map((submission) => {
			return SubmissionMapper.mapToStatusResponse(submission);
		});

		const listResponse = new SubmissionStatusListResponse(submissionResponses);

		return listResponse;
	}
}
