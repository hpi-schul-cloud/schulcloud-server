import { Injectable } from '@nestjs/common';
import { Course, Lesson, User } from '../entity';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '../types';

export type LessonCopyParams = {
	originalLesson: Lesson;
	destinationCourse: Course;
	user: User;
};

@Injectable()
export class LessonCopyService {
	copyLesson(params: LessonCopyParams): CopyStatus {
		const copy = new Lesson({
			course: params.destinationCourse,
			hidden: params.originalLesson.hidden,
			name: params.originalLesson.name,
			position: params.originalLesson.position,
		});

		const status: CopyStatus = {
			title: copy.name,
			type: CopyElementType.LESSON,
			status: CopyStatusEnum.PARTIAL,
			copyEntity: copy,
			elements: [
				{
					title: 'metadata',
					type: CopyElementType.LEAF,
					status: CopyStatusEnum.SUCCESS,
				},
				{
					title: 'content',
					type: CopyElementType.LESSON_CONTENT,
					status: CopyStatusEnum.NOT_IMPLEMENTED,
				},
				{
					title: 'material',
					type: CopyElementType.LESSON_MATERIAL,
					status: CopyStatusEnum.NOT_IMPLEMENTED,
				},
			],
		};

		return status;
	}
}
