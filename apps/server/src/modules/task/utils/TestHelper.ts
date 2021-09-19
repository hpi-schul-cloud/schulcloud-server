/* istanbul ignore file */

import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId, Course, TestHelper } from '@shared/domain';

import { Submission, Task, UserTaskInfo, LessonTaskInfo, ITaskParent, IParentDescriptionsProperties } from '../entity';

export class TaskParentTestEntity implements ITaskParent {
	id: EntityId;

	user?: EntityId;

	constructor(userIdWithWritePermissions?: EntityId) {
		this.user = userIdWithWritePermissions;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	hasWritePermission(userId: EntityId): boolean {
		const hasWritePermission = this.user !== undefined ? this.user === userId : false;
		return hasWritePermission;
	}

	getDescriptions(): IParentDescriptionsProperties {
		return {
			id: this.id,
			color: 'FFFFFF',
			name: 'Parent',
		};
	}

	getNumberOfStudents(): number {
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
		const parent = new Course({ schoolId: new ObjectId() });
		const id = this.createId(parentId);
		parent._id = id;
		parent.id = id.toHexString();
		const task = new Task({ name: '', parent, dueDate });
		this.addId(task);
		return task;
	}

	createLessonWithTask(): { task: Task; lesson: LessonTaskInfo; parentId: EntityId } {
		const parent = new Course({ schoolId: new ObjectId() });
		this.addId(parent);
		const lesson = new LessonTaskInfo({ course: parent });
		this.addId(lesson);
		const task = new Task({ name: '', parent, lesson });
		this.addId(task);
		return { task, lesson, parentId: parent.id };
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
