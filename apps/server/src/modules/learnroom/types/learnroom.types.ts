import { Course as CourseEntity, CourseMetadata, CourseType, LessonEntity, Task } from '@shared/domain/entity';
import type { ColumnBoardNode } from '../repo';

export type Learnroom = CourseEntity;

export type LearnroomTypes = CourseType;

export type LearnroomMetadata = CourseMetadata;

/**
 * @Deprecated
 */
export type LearnroomElement = Task | LessonEntity | ColumnBoardNode;
