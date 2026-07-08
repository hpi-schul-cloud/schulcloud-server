import { type LessonEntity } from '@modules/lesson/repo';
import { type Submission, type Task } from '@modules/task/repo';

export type EntitiesWithFiles = Task | LessonEntity | Submission;
export type EntityWithEmbeddedFiles = Task | LessonEntity;
export type FileUrlReplacement = {
	regex: RegExp;
	replacement: string;
};
