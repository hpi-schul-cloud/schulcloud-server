import { InputFormat } from '@shared/domain/types';

export interface ITask {
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

export interface TaskStatus {
	submitted: number;
	maxSubmissions: number;
	graded: number;
	isDraft: boolean;
	isSubstitutionTeacher: boolean;
	isFinished: boolean;
}
