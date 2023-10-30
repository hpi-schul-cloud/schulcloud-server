import { Course } from '../entity/course.entity';
import { LessonEntity } from '../entity/lesson.entity';
import { SchoolEntity } from '../entity/school.entity';
import { Submission } from '../entity/submission.entity';
import { User } from '../entity/user.entity';
import { InputFormat } from './input-format.types';

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
