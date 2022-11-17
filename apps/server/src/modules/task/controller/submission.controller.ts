import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@shared/domain';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { SubmissionMapper } from '../mapper';
import { SubmissionUC } from '../uc';
import { TaskUrlParams } from './dto';
import { SubmissionListResponse } from './dto/submission.response';

@ApiTags('Submission')
@Authenticate('jwt')
@Controller('submissions')
export class SubmissionController {
	constructor(private readonly submissionsUc: SubmissionUC) {}

	@Get(':taskId')
	async findAllByTask(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: TaskUrlParams
	): Promise<SubmissionListResponse> {
		const [submissions] = await this.submissionsUc.findAllByTask(currentUser.userId, params.taskId);

		const submissionResponses = submissions.map((submission) => {
			return SubmissionMapper.mapToResponse(submission);
		});

		const listResponse = new SubmissionListResponse(submissionResponses, submissionResponses.length);

		return listResponse;
	}
}
