import { LessonEntity, Submission, Task } from '@shared/domain';

export type EntitiesWithFiles = Task | LessonEntity | Submission;
export type EntityWithEmbeddedFiles = Task | LessonEntity;
