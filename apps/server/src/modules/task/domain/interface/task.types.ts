import { type InputFormat } from '@shared/domain/types';

export interface ITask {
	name: string;
	description?: string;
	descriptionInputFormat?: InputFormat;
	availableDate?: Date;
	dueDate?: Date;
	publicSubmissions?: boolean;
	teamSubmissions?: boolean;
	maxTeamMembers?: number;
}

export interface TaskUpdate extends ITask {
	courseId?: string;
	lessonId?: string;
	private?: boolean;
}

export interface TaskCreate extends ITask {
	courseId?: string;
	lessonId?: string;
	private?: boolean;
}

export interface TaskStatus {
	submitted: number;
	maxSubmissions: number;
	graded: number;
	isDraft: boolean;
	isSubstitutionTeacher: boolean;
	isFinished: boolean;
}
