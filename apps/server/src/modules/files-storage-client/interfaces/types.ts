import { LessonEntity } from '@modules/lesson/repository';
import { Task } from '@modules/task/repo';
import { Submission } from '@shared/domain/entity';

export type EntitiesWithFiles = Task | LessonEntity | Submission;
export type EntityWithEmbeddedFiles = Task | LessonEntity;
export type FileUrlReplacement = {
	regex: RegExp;
	replacement: string;
};
