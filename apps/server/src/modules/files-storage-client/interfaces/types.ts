import { LessonEntity, Submission, Task } from '@shared/domain/entity';

export type EntitiesWithFiles = Task | LessonEntity | Submission;
export type EntityWithEmbeddedFiles = Task | LessonEntity;
export type FileUrlReplacement = {
	regex: RegExp;
	replacement: string;
};
