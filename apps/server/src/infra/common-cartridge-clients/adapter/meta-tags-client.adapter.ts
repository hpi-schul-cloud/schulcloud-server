import { Injectable } from '@nestjs/common';
import { MetaTagExtractorApi, type MetaTagExtractorResponse } from '../generated';
import { AdapterUtils } from './adapter.utils';

@Injectable()
export class MetaTagsClientAdapter {
	constructor(private readonly metaTagExtractorApi: MetaTagExtractorApi) {}

	public async getMetaTags(jwt: string, url: string): Promise<MetaTagExtractorResponse> {
		const response = await this.metaTagExtractorApi.metaTagExtractorControllerGetMetaTags(
			{ url },
			AdapterUtils.createAxiosConfigForJwt(jwt)
		);

		return response.data;
	}
}
