import { LessonService } from '@modules/lesson';
import { Injectable } from '@nestjs/common';
import type { UrlHandler } from '../../interface/url-handler';
import { MetaData } from '../../types';
import { AbstractUrlHandler } from './abstract-url-handler';

@Injectable()
export class LessonUrlHandler extends AbstractUrlHandler implements UrlHandler {
	patterns: RegExp[] = [/\/topics\/([0-9a-z]+)$/i];

	constructor(private readonly lessonService: LessonService) {
		super();
	}

	async getMetaData(url: string): Promise<MetaData | undefined> {
		const id = this.extractId(url);
		if (id === undefined) {
			return undefined;
		}

		const metaData = this.getDefaultMetaData(url, { type: 'lesson' });
		const lesson = await this.lessonService.findById(id);
		if (lesson) {
			metaData.title = lesson.name;
		}

		return metaData;
	}
}
