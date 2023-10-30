import { LessonEntity } from '@shared/domain/entity/lesson.entity';
import { Submission } from '@shared/domain/entity/submission.entity';
import { Task } from '@shared/domain/entity/task.entity';

export type EntitiesWithFiles = Task | LessonEntity | Submission;
export type EntityWithEmbeddedFiles = Task | LessonEntity;
