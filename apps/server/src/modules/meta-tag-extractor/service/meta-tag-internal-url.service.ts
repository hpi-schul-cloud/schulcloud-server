import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Injectable } from '@nestjs/common';
import type { UrlHandler } from '../interface/url-handler';
import { MetaData } from '../types';
import { BoardUrlHandler, CourseUrlHandler, LessonUrlHandler, TaskUrlHandler } from './url-handler';

@Injectable()
export class MetaTagInternalUrlService {
	private handlers: UrlHandler[] = [];

	constructor(
		private readonly taskUrlHandler: TaskUrlHandler,
		private readonly lessonUrlHandler: LessonUrlHandler,
		private readonly courseUrlHandler: CourseUrlHandler,
		private readonly boardUrlHandler: BoardUrlHandler
	) {
		this.handlers = [this.taskUrlHandler, this.lessonUrlHandler, this.courseUrlHandler, this.boardUrlHandler];
	}

	async tryInternalLinkMetaTags(url: string): Promise<MetaData | undefined> {
		if (this.isInternalLink(url)) {
			return this.composeMetaTags(url);
		}
		return Promise.resolve(undefined);
	}

	isInternalLink(url: string) {
		const domain = (Configuration.get('SC_DOMAIN') as string) ?? 'nothing-configured-for-internal-links.de';
		const isInternal = url.toLowerCase().includes(domain.toLowerCase());
		return isInternal;
	}

	private async composeMetaTags(url: string): Promise<MetaData | undefined> {
		const urlObject = new URL(url);

		const handler = this.handlers.find((h) => h.doesUrlMatch(url));
		if (handler) {
			const result = await handler.getMetaData(url);
			return result;
		}

		const title = urlObject.pathname;
		return Promise.resolve({
			title,
			description: '',
			url,
			type: 'unknown',
		});
	}
}
