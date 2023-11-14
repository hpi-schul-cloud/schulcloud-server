import type { Course, InputFormat, LessonEntity, SchoolEntity, Submission, User } from '@shared/domain/';

interface TaskInterface {
	name: string;
	description?: string;
	descriptionInputFormat?: InputFormat;
	availableDate?: Date;
	dueDate?: Date;
}

export interface TaskUpdate extends TaskInterface {
	courseId?: string;
	lessonId?: string;
}

export interface TaskCreate extends TaskInterface {
	courseId?: string;
	lessonId?: string;
}

export interface ITaskProperties extends TaskInterface {
	course?: Course;
	lesson?: LessonEntity;
	creator: User;
	school: SchoolEntity;
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
