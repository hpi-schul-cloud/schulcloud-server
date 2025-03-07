import type { CourseEntity } from '@modules/course/repo';
import { LessonEntity } from '@modules/lesson/repo';
import type { SchoolEntity } from '@modules/school/repo';
import { User } from '@modules/user/repo';
import type { Submission } from '../entity';
import type { InputFormat } from './input-format.types';

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
	course?: CourseEntity;
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
