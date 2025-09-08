import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Injectable } from '@nestjs/common';
import type { UrlHandler } from '../interface/url-handler';
import { MetaData, MetaDataEntityType } from '../types';
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

	public tryInternalLinkMetaTags(url: URL): Promise<MetaData | undefined> {
		if (this.isInternalUrl(url)) {
			return this.composeMetaTags(url);
		}
		return Promise.resolve(undefined);
	}

	public isInternalUrl(url: URL): boolean {
		let domain = Configuration.get('SC_DOMAIN') as string;
		domain = domain === '' ? 'nothing-configured-for-internal-url.de' : domain;
		const isInternal = url.hostname.toLowerCase() === domain.toLowerCase();
		return isInternal;
	}

	private async composeMetaTags(url: URL): Promise<MetaData | undefined> {
		const handler = this.handlers.find((h) => h.doesUrlMatch(url));

		if (handler) {
			const result = await handler.getMetaData(url);

			return result;
		}

		return Promise.resolve({
			title: url.pathname,
			description: '',
			url: url.toString(),
			type: MetaDataEntityType.UNKNOWN,
		});
	}
}
