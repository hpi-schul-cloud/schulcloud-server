import { CourseEntity, CourseMetadata, CourseType } from '@modules/course/repo';
import { LessonEntity } from '@modules/lesson/repository';
import { Task } from '@modules/task/repo';
import type { ColumnBoardNode } from '../repo';

export type Learnroom = CourseEntity;

export type LearnroomTypes = CourseType;

export type LearnroomMetadata = CourseMetadata;

/**
 * @Deprecated
 */
export type LearnroomElement = Task | LessonEntity | ColumnBoardNode;
