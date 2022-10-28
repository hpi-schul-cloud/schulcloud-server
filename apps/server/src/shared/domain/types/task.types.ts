import type { Course, File, Lesson, School, Submission, User } from '@shared/domain/';

interface ITask {
	name: string;
	description?: string;
	availableDate?: Date;
	dueDate?: Date;
}

export interface ITaskUpdate extends ITask {
	courseId: string;
	lessonId?: string;
}

export interface ITaskCreate extends ITask {
	courseId: string;
	lessonId?: string;
}

export interface ITaskProperties extends ITask {
	course?: Course;
	lesson?: Lesson;
	creator: User;
	school: School;
	files?: File[];
	finished?: User[];
	private?: boolean;
	submissions?: Submission[];
}

export interface ITaskStatus {
	submitted: number;
	maxSubmissions: number;
	graded: number;
	isDraft: boolean;
	isSubstitutionTeacher: boolean;
	isFinished: boolean;
}
