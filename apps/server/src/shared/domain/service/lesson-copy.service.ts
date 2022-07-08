import { Injectable } from '@nestjs/common';
import { FeathersServiceProvider } from '@shared/infra/feathers';
import { randomBytes } from 'crypto';
import { Configuration } from '@hpi-schul-cloud/commons';
import {
	ComponentType,
	Course,
	IComponentEtherpadProperties,
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
	constructor(
		private readonly copyHelperService: CopyHelperService,
		private readonly feathersServiceProvider: FeathersServiceProvider
	) {}

	async copyLesson(params: LessonCopyParams): Promise<CopyStatus> {
		const { copiedContent, contentStatus } = await this.copyLessonContent(params.originalLesson.contents || [], params);
		const copy = new Lesson({
			course: params.destinationCourse,
			hidden: true,
			name: this.copyHelperService.deriveCopyName(params.originalLesson.name),
			position: params.originalLesson.position,
			contents: copiedContent,
		});

		const elements = [...LessonCopyService.lessonStatusMetadata(), ...contentStatus];

		const status: CopyStatus = {
			title: copy.name,
			type: CopyElementType.LESSON,
			status: this.copyHelperService.deriveStatusFromElements(elements),
			copyEntity: copy,
			elements,
		};

		return status;
	}

	private async copyLessonContent(
		content: IComponentProperties[],
		params: LessonCopyParams
	): Promise<{
		copiedContent: IComponentProperties[];
		contentStatus: CopyStatus[];
	}> {
		const copiedContent: IComponentProperties[] = [];
		const copiedContentStatus: CopyStatus[] = [];
		for (let i = 0; i < content.length; i += 1) {
			const element = content[i];
			if (element.component === ComponentType.TEXT || element.component === ComponentType.LERNSTORE) {
				copiedContent.push(element);
				copiedContentStatus.push({
					title: element.title,
					type: CopyElementType.LESSON_CONTENT,
					status: CopyStatusEnum.SUCCESS,
				});
			}
			if (element.component === ComponentType.GEOGEBRA) {
				const geoGebraContent = LessonCopyService.copyGeogebra(element);
				copiedContent.push(geoGebraContent);
				copiedContentStatus.push({
					title: element.title,
					type: CopyElementType.LESSON_CONTENT,
					status: CopyStatusEnum.PARTIAL,
				});
			}
			if (element.component === ComponentType.ETHERPAD) {
				// eslint-disable-next-line no-await-in-loop
				const etherpadContent = await this.copyEtherpad(element, params);
				copiedContent.push(etherpadContent);
				copiedContentStatus.push({
					title: element.title,
					type: CopyElementType.LESSON_CONTENT,
					status: CopyStatusEnum.PARTIAL,
				});
			}
		}
		const contentStatus = this.lessonStatusContent(copiedContentStatus);
		return { copiedContent, contentStatus };
	}

	private static copyGeogebra(originalElement: IComponentProperties): IComponentProperties {
		const copy = { ...originalElement, hidden: true } as IComponentProperties;
		copy.content = { ...copy.content, materialId: '' } as IComponentGeogebraProperties;
		return copy;
	}

	private async copyEtherpad(
		originalElement: IComponentProperties,
		params: LessonCopyParams
	): Promise<IComponentProperties> {
		// new env as in client ETHERPAD__PAD_URI
		const copy = { ...originalElement, hidden: true } as IComponentProperties;
		const content = { ...copy.content, url: '' } as unknown as IComponentEtherpadProperties;
		// TODO generate new Etherpad
		content.url = 'TODO';
		content.title = randomBytes(12).toString('hex');

		try {
			const etherpadPadId = await this.createEtherpad(
				params.user,
				params.destinationCourse.id,
				originalElement.title,
				content.description
			);
			// content.url = pad as string;
			// TODO add this to dof
			const etherpadUri = Configuration.get('ETHERPAD_NEW_PAD_URI') as string;
			content.url = `${etherpadUri}/${etherpadPadId}`;
			// eslint-disable-next-line no-empty
		} catch (e) {
			// TODO return some error - status should be fail
		}

		copy.content = content;
		return copy;
	}

	private async createEtherpad(user: User, courseId: string, title: string, description: string) {
		const service = this.feathersServiceProvider.getService('/etherpad/pads');
		const params = {
			courseId,
			padName: title,
			text: description,
		};
		const userId = user.id;
		const pad = (await service.create({ userId }, params)) as unknown as Promise<string>;
		return pad;
	}

	private static lessonStatusMetadata(): CopyStatus[] {
		return [
			{
				title: 'metadata',
				type: CopyElementType.LEAF,
				status: CopyStatusEnum.SUCCESS,
			},
		];
	}

	private lessonStatusContent(elements: CopyStatus[]): CopyStatus[] {
		if (elements.length > 0) {
			const componentStatus = {
				title: 'contents',
				type: CopyElementType.LESSON_CONTENT_GROUP,
				status: this.copyHelperService.deriveStatusFromElements(elements),
				elements,
			};
			return [componentStatus];
		}
		return [];
	}
}
