import { Injectable } from '@nestjs/common';
import { ComponentType, Course, IComponentProperties, Lesson, User } from '../entity';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '../types';
import { CopyHelperService } from './copy-helper.service';

export type LessonCopyParams = {
	originalLesson: Lesson;
	destinationCourse: Course;
	user: User;
};

@Injectable()
export class LessonCopyService {
	constructor(private readonly copyHelperService: CopyHelperService) {}

	copyLesson(params: LessonCopyParams): CopyStatus {
		const copy = new Lesson({
			course: params.destinationCourse,
			hidden: true,
			name: this.copyHelperService.deriveCopyName(params.originalLesson.name),
			position: params.originalLesson.position,
			contents: this.copyTextComponent(params.originalLesson.contents || []),
		});

		const elements = [...this.lessonStatusElements(), ...this.textComponentStatus(copy.contents)];

		const status: CopyStatus = {
			title: copy.name,
			type: CopyElementType.LESSON,
			status: CopyStatusEnum.SUCCESS,
			copyEntity: copy,
			elements,
		};

		return status;
	}

	private copyTextComponent(originalContent: IComponentProperties[]): IComponentProperties[] {
		const copiedContent: IComponentProperties[] = [];
		originalContent.forEach((element) => {
			if (element.component === ComponentType.TEXT) {
				copiedContent.push(element);
			}
		});
		return copiedContent;
	}

	private lessonStatusElements(): CopyStatus[] {
		return [
			{
				type: CopyElementType.METADATA,
				status: CopyStatusEnum.SUCCESS,
			},
		];
	}

	private textComponentStatus(copiedTextContent: IComponentProperties[]): CopyStatus[] {
		if (copiedTextContent.length > 0) {
			const elements = copiedTextContent.map((content) => ({
				title: content.title,
				type: CopyElementType.LESSON_CONTENT,
				status: CopyStatusEnum.SUCCESS,
			}));
			const componentStatus = {
				type: CopyElementType.LESSON_CONTENT_GROUP,
				status: CopyStatusEnum.SUCCESS,
				elements,
			};
			return [componentStatus];
		}
		return [];
	}
}
