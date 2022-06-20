import { Injectable } from '@nestjs/common';
import { Course, Lesson, User } from '../entity';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '../types';

export type LessonCopyParams = {
	originalLesson: Lesson;
	destinationCourse: Course;
	user: User;
};

export type LessonCopyResponse = {
	// copy: Lesson;
	status: CopyStatus;
};

@Injectable()
export class LessonCopyService {
	copyLesson(params: LessonCopyParams): LessonCopyResponse {
		const result = {
			status: {
				title: params.originalLesson.name,
				type: CopyElementType.LESSON,
				status: CopyStatusEnum.NOT_IMPLEMENTED,
			},
		};
		return result;
	}
}
