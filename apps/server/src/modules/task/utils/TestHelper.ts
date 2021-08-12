import { EntityId, TestHelper } from '@shared/domain';

import { Submission, Task, UserTaskInfo } from '../entity';

export class TaskTestHelper extends TestHelper<UserTaskInfo, EntityId> {
	createSchool(): EntityId {
		return this.createEntityId();
	}

	createUser(): UserTaskInfo {
		const user = new UserTaskInfo({ lastName: '', firstName: ''});
		this.addId(user);
		return user;
	}

	createTask(courseId?: EntityId): Task {
		const id = courseId || this.createEntityId();
		const task = new Task({ name: '', courseId: id });
		this.addId(task);
		return task;
	}

	createSubmission(task: Task, student?: UserTaskInfo): Submission {
		const user = student || this.getFirstUser();
		const submission = new Submission({ student: user, comment: '', task });
		this.addId(submission);
		return submission;
	}

	createTeamMemberSubmission(task: Task, students: UserTaskInfo[]): Submission {
		const submission = new Submission({ student: students[0], comment: '', task, teamMembers: students });
		this.addId(submission);
		return submission;
	}

	createSubmissionsForEachStudent(task: Task): Submission[] {
		const submissions = this.getUsers().map((student) => {
			const submission = this.createSubmission(task, student);
			return submission;
		});
		return submissions;
	}
}
