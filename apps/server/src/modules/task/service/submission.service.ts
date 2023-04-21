import { Injectable } from '@nestjs/common';
import { Counted, EntityId, ISubmissionProperties, Submission, Task, User } from '@shared/domain';
import { SubmissionRepo, TaskRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization';
import { FileParamBuilder, FilesStorageClientAdapterService } from '@src/modules/files-storage-client';

@Injectable()
export class SubmissionService {
	constructor(
		private readonly submissionRepo: SubmissionRepo,
		private readonly taskRepo: TaskRepo,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService,
		private readonly authorizationService: AuthorizationService
	) {}

	async findById(submissionId: EntityId): Promise<Submission> {
		return this.submissionRepo.findById(submissionId);
	}

	async findAllByTask(taskId: EntityId): Promise<Counted<Submission[]>> {
		const submissions = this.submissionRepo.findAllByTaskIds([taskId]);

		return submissions;
	}

	async findByUserAndTask(userId: EntityId, taskId: EntityId): Promise<Submission[]> {
		const [submissions] = await this.submissionRepo.findAllByUserId(userId);
		const filteredSubmissions = submissions.filter((submission) => submission.task.id === taskId);

		return filteredSubmissions;
	}

	async delete(submission: Submission): Promise<void> {
		const params = FileParamBuilder.build(submission.school.id, submission);
		await this.filesStorageClientAdapterService.deleteFilesOfParent(params);

		await this.submissionRepo.delete(submission);
	}

	async createEmptySubmissionForUser(user: User, task: Task): Promise<Submission> {
		const submissionParams: ISubmissionProperties = {
			school: user.school,
			task,
			student: user,
			comment: '',
			submitted: true,
			teamMembers: [user],
		};

		const submission = new Submission(submissionParams);
		await this.submissionRepo.save(submission);

		return submission;
	}
}
