import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Injectable } from '@nestjs/common';
import type { UrlHandler } from '../interface/url-handler';
import { MetaData } from '../types';
import { BoardUrlHandler, CourseUrlHandler, H5pUrlHandler, LessonUrlHandler, TaskUrlHandler } from './url-handler';

@Injectable()
export class MetaTagInternalUrlService {
	private handlers: UrlHandler[] = [];

	constructor(
		private readonly taskUrlHandler: TaskUrlHandler,
		private readonly lessonUrlHandler: LessonUrlHandler,
		private readonly courseUrlHandler: CourseUrlHandler,
		private readonly boardUrlHandler: BoardUrlHandler,
		private readonly h5pUrlHandler: H5pUrlHandler
	) {
		this.handlers = [
			this.taskUrlHandler,
			this.lessonUrlHandler,
			this.courseUrlHandler,
			this.boardUrlHandler,
			this.h5pUrlHandler,
		];
	}

	async tryInternalLinkMetaTags(url: string): Promise<MetaData | undefined> {
		if (this.isInternalUrl(url)) {
			return this.composeMetaTags(url);
		}
		return Promise.resolve(undefined);
	}

	isInternalUrl(url: string) {
		let domain = Configuration.get('SC_DOMAIN') as string;
		domain = domain === '' ? 'nothing-configured-for-internal-url.de' : domain;
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
