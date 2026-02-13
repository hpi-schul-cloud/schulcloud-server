import { Inject, Injectable } from '@nestjs/common';
import type { UrlHandler } from '../interface/url-handler';
import { META_TAG_EXTRACTOR_CONFIG_TOKEN, MetaTagExtractorConfig } from '../meta-tag-extractor.config';
import { MetaData, MetaDataEntityType } from '../types';
import { BoardUrlHandler, CourseUrlHandler, LessonUrlHandler, TaskUrlHandler } from './url-handler';

@Injectable()
export class MetaTagInternalUrlService {
	private handlers: UrlHandler[] = [];

	constructor(
		private readonly taskUrlHandler: TaskUrlHandler,
		private readonly lessonUrlHandler: LessonUrlHandler,
		private readonly courseUrlHandler: CourseUrlHandler,
		private readonly boardUrlHandler: BoardUrlHandler,
		@Inject(META_TAG_EXTRACTOR_CONFIG_TOKEN) private readonly config: MetaTagExtractorConfig
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
		let domain = this.config.scDomain;
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
