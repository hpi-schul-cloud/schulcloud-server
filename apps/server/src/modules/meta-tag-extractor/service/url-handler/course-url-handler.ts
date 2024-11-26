import { CourseService } from '@modules/learnroom';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import type { UrlHandler } from '../../interface/url-handler';
import { MetaData } from '../../types';
import { AbstractUrlHandler } from './abstract-url-handler';

@Injectable()
export class CourseUrlHandler extends AbstractUrlHandler implements UrlHandler {
	patterns: RegExp[] = [/\/course-rooms\/([0-9a-f]{24})$/i];

	constructor(@Inject(forwardRef(() => CourseService)) private readonly courseService: CourseService) {
		super();
	}

	async getMetaData(url: URL): Promise<MetaData | undefined> {
		const id = this.extractId(url);
		if (id === undefined) {
			return undefined;
		}

		const metaData = this.getDefaultMetaData(url, { type: 'course' });
		const course = await this.courseService.findById(id);
		if (course) {
			metaData.title = course.name;
		}

		return metaData;
	}
}
