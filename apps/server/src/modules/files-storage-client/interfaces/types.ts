import { Lesson, Submission, Task } from '@shared/domain';

export type EntitiesWithFiles = Task | Lesson | Submission;
export type EntityWithEmbeddedFiles = Task | Lesson;
