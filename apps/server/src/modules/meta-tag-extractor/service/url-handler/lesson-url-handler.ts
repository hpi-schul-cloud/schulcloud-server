import { LessonService } from '@modules/lesson';
import { Injectable } from '@nestjs/common';
import type { UrlHandler } from '../../interface/url-handler';
import { MetaData, MetaDataEntityType } from '../../types';
import { AbstractUrlHandler } from './abstract-url-handler';

@Injectable()
export class LessonUrlHandler extends AbstractUrlHandler implements UrlHandler {
	patterns: RegExp[] = [/^\/topics\/([0-9a-f]{24})$/i];

	constructor(private readonly lessonService: LessonService) {
		super();
	}

	async getMetaData(url: URL): Promise<MetaData | undefined> {
		const id = this.extractId(url);
		if (id === undefined) {
			return undefined;
		}

		const metaData = this.getDefaultMetaData(url, { type: MetaDataEntityType.LESSON });
		const lesson = await this.lessonService.findById(id);
		if (lesson) {
			metaData.title = lesson.name;
		}

		return metaData;
	}
}
