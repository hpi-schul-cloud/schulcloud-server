import { CourseEntity, CourseMetadata, CourseType } from '@modules/course/repo';
import { LessonEntity } from '@modules/lesson/repo';
import { Task } from '@shared/domain/entity';
import type { ColumnBoardNode } from '../repo';

export type Learnroom = CourseEntity;

export type LearnroomTypes = CourseType;

export type LearnroomMetadata = CourseMetadata;

/**
 * @Deprecated
 */
export type LearnroomElement = Task | LessonEntity | ColumnBoardNode;
