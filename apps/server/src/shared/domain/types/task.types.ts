import type { Course, InputFormat, Lesson, School, Submission, User } from '@shared/domain/';

interface ITask {
	name: string;
	description?: string;
	descriptionInputFormat?: InputFormat;
	availableDate?: Date;
	dueDate?: Date;
}

export interface ITaskUpdate extends ITask {
	courseId?: string;
	lessonId?: string;
}

export interface ITaskCreate extends ITask {
	courseId?: string;
	lessonId?: string;
}

export interface ITaskProperties extends ITask {
	course?: Course;
	lesson?: Lesson;
	creator: User;
	school: School;
	finished?: User[];
	private?: boolean;
	submissions?: Submission[];
	publicSubmissions?: boolean;
	teamSubmissions?: boolean;
}

export interface ITaskStatus {
	submitted: number;
	maxSubmissions: number;
	graded: number;
	isDraft: boolean;
	isSubstitutionTeacher: boolean;
	isFinished: boolean;
}
