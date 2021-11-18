import { DeepPartial } from 'fishery';
import { Submission, ISubmissionProperties } from '@shared/domain';
import { BaseFactory } from './base.factory';
import { taskFactory } from './task.factory';
import { userFactory } from './user.factory';

class SubmissionFactory extends BaseFactory<Submission, ISubmissionProperties> {
	graded(isGraded = true): this {
		const params: DeepPartial<ISubmissionProperties> = { gradeComment: isGraded ? 'graded text' : undefined };
		return this.params(params);
	}
}

export const submissionFactory = SubmissionFactory.define(Submission, ({ sequence }) => {
	return {
		task: taskFactory.build(),
		student: userFactory.build(),
		comment: `submission comment #${sequence}`,
	};
});
