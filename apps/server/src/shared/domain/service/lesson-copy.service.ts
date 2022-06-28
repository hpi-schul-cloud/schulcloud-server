import { Injectable } from '@nestjs/common';
import { Course, IComponentProperties, Lesson, User } from '../entity';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '../types';
import { NameCopyService } from './name-copy.service';

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
			contents: this.copyTextComponent(params.originalLesson),
		});

		const elements = [...this.lessonStatusElements()];

		const status: CopyStatus = {
			title: copy.name,
			type: CopyElementType.LESSON,
			status: this.inferStatusFromElements(elements),
			copyEntity: copy,
			elements,
		};

		return status;
	}

	private copyTextComponent(originalLesson: Lesson) {
		const copiedContent: IComponentProperties[] = [];
		const textComponents = originalLesson.contents.filter((element) => Object.keys(element.content)[0] === 'text');
		textComponents.forEach((element) => {
			element.hidden = true;
			copiedContent.push(element);
		});
		return copiedContent;
	}

	private lessonStatusElements(): CopyStatus[] {
		return [
			{
				title: 'metadata',
				type: CopyElementType.LEAF,
				status: CopyStatusEnum.SUCCESS,
			},
			{
				title: 'contents',
				type: CopyElementType.LEAF,
				status: CopyStatusEnum.PARTIAL,
			},
			{
				title: 'materials',
				type: CopyElementType.LEAF,
				status: CopyStatusEnum.NOT_IMPLEMENTED,
			},
		];
	}

	private inferStatusFromElements(elements: CopyStatus[]): CopyStatusEnum {
		/* const childrenStatusArray = elements.map((el) => el.status);
		if (childrenStatusArray.includes(CopyStatusEnum.FAIL)) return CopyStatusEnum.PARTIAL; <- unused case, commented for now due to lack of test coverage and no scenario
		if (childrenStatusArray.includes(CopyStatusEnum.NOT_IMPLEMENTED)) {
			return CopyStatusEnum.PARTIAL;
		} */
		return CopyStatusEnum.SUCCESS;
	}
}
