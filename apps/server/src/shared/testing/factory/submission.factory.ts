import { DeepPartial } from 'fishery';
import { Submission, ISubmissionProperties } from '@shared/domain';
import { BaseFactory } from './base.factory';
import { taskFactory } from './task.factory';
import { userFactory } from './user.factory';

class SubmissionFactory extends BaseFactory<Submission, ISubmissionProperties> {
	graded(): this {
		const params: DeepPartial<ISubmissionProperties> = { gradeComment: 'graded text' };

		return this.params(params);
	}

	studentWithId(): this {
		const params: DeepPartial<ISubmissionProperties> = { student: userFactory.buildWithId() };

		return this.params(params);
	}

	teamMembersWithId(numberOfTeamMembers: number): this {
		const teamMembers = userFactory.buildListWithId(numberOfTeamMembers);
		const params: DeepPartial<ISubmissionProperties> = { teamMembers };

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
