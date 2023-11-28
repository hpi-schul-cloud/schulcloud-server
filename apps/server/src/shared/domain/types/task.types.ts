import type { Course, InputFormat, LessonEntity, SchoolEntity, Submission, User } from '@shared/domain/';

interface ITask {
	name: string;
	description?: string;
	descriptionInputFormat?: InputFormat;
	availableDate?: Date;
	dueDate?: Date;
}

export interface TaskUpdate extends ITask {
	courseId?: string;
	lessonId?: string;
}

export interface TaskCreate extends ITask {
	courseId?: string;
	lessonId?: string;
}

export interface TaskProperties extends ITask {
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

export interface TaskStatus {
	submitted: number;
	maxSubmissions: number;
	graded: number;
	isDraft: boolean;
	isSubstitutionTeacher: boolean;
	isFinished: boolean;
}
