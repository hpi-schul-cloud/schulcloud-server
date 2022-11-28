import { ISubmissionProperties, Submission } from '@shared/domain';
import { DeepPartial } from 'fishery';
import { BaseFactory } from './base.factory';
import { schoolFactory } from './school.factory';
import { taskFactory } from './task.factory';
import { userFactory } from './user.factory';

class SubmissionFactory extends BaseFactory<Submission, ISubmissionProperties> {
	graded(): this {
		const params: DeepPartial<ISubmissionProperties> = { gradeComment: 'graded text' };
		return this.params(params);
	}
}

export const submissionFactory = SubmissionFactory.define(Submission, ({ sequence }) => {
	return {
		school: schoolFactory.build(),
		task: taskFactory.build(),
		student: userFactory.build(),
		comment: `submission comment #${sequence}`,
	};
});
