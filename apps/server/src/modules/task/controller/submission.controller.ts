import { Controller, Delete, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@src/modules/authentication/interface/user';
import { SubmissionMapper } from '../mapper/submission.mapper';
import { SubmissionUc } from '../uc/submission.uc';
import { SubmissionStatusListResponse } from './dto/submission.response';
import { SubmissionUrlParams } from './dto/submission.url.params';
import { TaskUrlParams } from './dto/task.url.params';

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

		const submissionResponses = submissions.map((submission) => SubmissionMapper.mapToStatusResponse(submission));

		const listResponse = new SubmissionStatusListResponse(submissionResponses);

		return listResponse;
	}

	@Delete(':submissionId')
	async delete(@Param() urlParams: SubmissionUrlParams, @CurrentUser() currentUser: ICurrentUser): Promise<boolean> {
		const result = await this.submissionUc.delete(currentUser.userId, urlParams.submissionId);

		return result;
	}
}
