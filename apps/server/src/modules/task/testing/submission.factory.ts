import { schoolEntityFactory } from '@modules/school/testing';
import { userFactory } from '@modules/user/testing';
import { BaseFactory } from '@testing/factory/base.factory';
import { type DeepPartial } from 'fishery';
import { Submission, type SubmissionProperties } from '../repo';
import { taskFactory } from './task.factory';

class SubmissionFactory extends BaseFactory<Submission, SubmissionProperties> {
	public graded(): this {
		const params: DeepPartial<SubmissionProperties> = { graded: true };

		return this.params(params);
	}

	public submitted(): this {
		const params: DeepPartial<SubmissionProperties> = { submitted: true };

		return this.params(params);
	}

	public studentWithId(): this {
		const params: DeepPartial<SubmissionProperties> = { student: userFactory.buildWithId() };

		return this.params(params);
	}

	public teamMembersWithId(numberOfTeamMembers: number): this {
		const teamMembers = userFactory.buildListWithId(numberOfTeamMembers);
		const params: DeepPartial<SubmissionProperties> = { teamMembers };

		return this.params(params);
	}
}

export const submissionFactory = SubmissionFactory.define(Submission, ({ sequence }) => {
	return {
		school: schoolEntityFactory.build(),
		task: taskFactory.build(),
		student: userFactory.build(),
		comment: `submission comment #${sequence}`,
	};
});
