import { Course, Lesson, User } from '@shared/domain';

export type LessonCopyParams = {
	originalLesson: Lesson;
	destinationCourse: Course;
	user: User;
	copyName?: string;
};
