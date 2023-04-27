import { Controller, Delete, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { SubmissionMapper } from '../mapper';
import { SubmissionUc } from '../uc';
import { SubmissionStatusListResponse, SubmissionUrlParams, TaskUrlParams } from './dto';

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
