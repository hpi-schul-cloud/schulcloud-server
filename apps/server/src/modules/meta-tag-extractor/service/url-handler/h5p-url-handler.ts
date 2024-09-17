import { Injectable } from '@nestjs/common';
import { ContentStorage } from '@modules/h5p-editor';
import type { UrlHandler } from '../../interface/url-handler';
import { MetaData } from '../../types';
import { AbstractUrlHandler } from './abstract-url-handler';

@Injectable()
export class H5pUrlHandler extends AbstractUrlHandler implements UrlHandler {
	patterns: RegExp[] = [/\/h5p\/player\/([0-9a-z]{24})$/i];

	constructor(private readonly contentStorage: ContentStorage) {
		super();
	}

	async getMetaData(url: string): Promise<MetaData | undefined> {
		const id = this.extractId(url);
		if (id === undefined) {
			return undefined;
		}

		const metaData = this.getDefaultMetaData(url, { type: 'external' });

		const h5pContentMetadata = await this.contentStorage.getMetadata(id);
		if (h5pContentMetadata) {
			metaData.title = h5pContentMetadata.title;
		}

		return metaData;
	}
}
