import { type CourseEntity, type CourseMetadata, type CourseType } from '@modules/course/repo';
import { type LessonEntity } from '@modules/lesson/repo';
import { type Task } from '@modules/task/repo';
import { type ColumnBoardNode } from './room-board.types';

export type Learnroom = CourseEntity;

export type LearnroomTypes = CourseType;

export type LearnroomMetadata = CourseMetadata;

/**
 * @Deprecated
 */
export type LearnroomElement = Task | LessonEntity | ColumnBoardNode;
