import { EntityId, TestHelper } from '@shared/domain';

import { Submission, Task, UserTaskInfo, LessonTaskInfo, ITaskParent, IParentDescriptionsProperties } from '../entity';

export class TaskParentTestEntity implements ITaskParent {
	id: EntityId;

	constructor(userIdWithWritePermissions?: EntityId) {
		this.hasWritePermission = (userId: EntityId): boolean => {
			const hasWritePermission = userIdWithWritePermissions === userId;
			return hasWritePermission;
		};
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	hasWritePermission(userId: EntityId): boolean {
		return false;
	}

	getDescriptions(): IParentDescriptionsProperties {
		return {
			id: this.id,
			color: 'FFFFFF',
			name: 'Parent',
		};
	}

	getStudentsNumber(): number {
		return 10;
	}
}

export class TaskTestHelper extends TestHelper<EntityId> {
	createSchool(): EntityId {
		return this.createEntityId();
	}

	createUser(): UserTaskInfo {
		const user = new UserTaskInfo({ lastName: '', firstName: '' });
		this.addId(user);
		return user;
	}

	createTaskParent(userIdWithWritePermissions?: EntityId): TaskParentTestEntity {
		const parent = new TaskParentTestEntity(userIdWithWritePermissions);
		parent.id = this.createEntityId();
		return parent;
	}

	createTask(parentId?: EntityId, dueDate?: Date): Task {
		const id = parentId || this.createEntityId();
		const task = new Task({ name: '', parentId: id, dueDate });
		this.addId(task);
		return task;
	}

	createLessonWithTask(): { task: Task; lesson: LessonTaskInfo; parentId: EntityId } {
		const parentId = this.createEntityId();
		const lesson = new LessonTaskInfo({ courseId: parentId });
		this.addId(lesson);
		const task = new Task({ name: '', parentId, lesson });
		this.addId(task);
		return { task, lesson, parentId };
	}

	createSubmission(task: Task, student?: UserTaskInfo): Submission {
		const user = (student || this.getFirstUser()) as UserTaskInfo;
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
			const submission = this.createSubmission(task, student as UserTaskInfo);
			return submission;
		});
		return submissions;
	}
}
