import { Injectable } from '@nestjs/common';
import {
	ComponentType,
	Course,
	IComponentGeogebraProperties,
	IComponentProperties,
	Lesson,
	User,
} from '../entity';
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
			contents: this.copyLessonContents(params.originalLesson.contents || []),
		});

		const elements = [...this.lessonStatusElements(), ...this.componentStatus(copy.contents)];

		const status: CopyStatus = {
			title: copy.name,
			type: CopyElementType.LESSON,
			status: CopyStatusEnum.SUCCESS,
			copyEntity: copy,
			elements,
		};

		return status;
	}

	private copyLessonContents(contents: IComponentProperties[]): IComponentProperties[] {
		const copiedContent: IComponentProperties[] = [];
		contents.forEach((element) => {
			if (element.component === ComponentType.TEXT || element.component === ComponentType.LERNSTORE) {
				copiedContent.push(element);
			} else if (element.component === ComponentType.GEOGEBRA) {
				const geoGebraContent = this.copyGeogebra(element);
				copiedContent.push(geoGebraContent);
			}
		});
		return copiedContent;
	}

	private copyGeogebra(originalElement: IComponentProperties): IComponentProperties {
		const copy = { ...originalElement, hidden: true };
		const content = { ...copy.content, materialId: '' } as IComponentGeogebraProperties;
		copy.content = content;
		return copy;
	}

	private lessonStatusElements(): CopyStatus[] {
		return [
			{
				title: 'metadata',
				type: CopyElementType.LEAF,
				status: CopyStatusEnum.SUCCESS,
			},
		];
	}

	private componentStatus(copiedContent: IComponentProperties[]): CopyStatus[] {
		if (copiedContent.length > 0) {
			const elements = copiedContent.map((content) => ({
				title: content.title,
				type: CopyElementType.LESSON_CONTENT,
				status: CopyStatusEnum.SUCCESS,
			}));
			const componentStatus = {
				title: 'contents',
				type: CopyElementType.LESSON_CONTENT_GROUP,
				status: CopyStatusEnum.SUCCESS,
				elements,
			};
			return [componentStatus];
		}
		return [];
	}
}
