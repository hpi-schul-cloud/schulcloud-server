import { CourseEntity, CourseMetadata, CourseType } from '@modules/course/repo';
import { LessonEntity } from '@modules/lesson/repo';
import { Task } from '@modules/task/repo';
import { ColumnBoardNode } from './room-board.types';

export type Learnroom = CourseEntity;

export type LearnroomTypes = CourseType;

export type LearnroomMetadata = CourseMetadata;

/**
 * @Deprecated
 */
export type LearnroomElement = Task | LessonEntity | ColumnBoardNode;
