import { Injectable } from '@nestjs/common';
import { NameCopyService } from './name-copy.service';
import { Course, Lesson, User } from '../entity';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '../types';

export type LessonCopyParams = {
	originalLesson: Lesson;
	destinationCourse: Course;
	user: User;
};

@Injectable()
export class LessonCopyService {
	constructor(private readonly nameCopyService: NameCopyService) {}

	copyLesson(params: LessonCopyParams): CopyStatus {
		const copy = new Lesson({
			course: params.destinationCourse,
			hidden: true,
			name: this.nameCopyService.deriveCopyName(params.originalLesson.name),
			position: params.originalLesson.position,
		});

		const status: CopyStatus = {
			title: copy.name,
			type: CopyElementType.LESSON,
			status: CopyStatusEnum.SUCCESS,
			copyEntity: copy,
			elements: [
				{
					title: 'metadata',
					type: CopyElementType.LEAF,
					status: CopyStatusEnum.SUCCESS,
				},
			],
		};

		return status;
	}
}
