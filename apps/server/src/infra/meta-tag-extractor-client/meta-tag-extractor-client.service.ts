import { HttpService } from '@nestjs/axios';
// import { Logger } from '@src/core/logger';
import { firstValueFrom } from 'rxjs';
// import { JwtExtractorService } from '@infra/jwt-extractor';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { MetaTagExtractorResponse } from '@modules/meta-tag-extractor/controller/dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MetaTagExtractorAdapterService {
	constructor(private readonly httpService: HttpService) {}

	async getMetaData(linkUrl: URL): Promise<MetaTagExtractorResponse> {
		const publicBackendUrl = Configuration.get('PUBLIC_BACKEND_URL') as string;
		const metaTagExtractorUrl = `${publicBackendUrl}/v3/meta-tag-extractor`;
		try {
			const conf = {
				headers: {
					accept: 'application/json',
					'Content-Type': 'application/json',
					'x-api-key': '7ccd4e11-c6f6-48b0-81eb-cccf7922e7a4',
				},
			}; // TODO: decide if timeout should be configured
			const request = this.httpService.post<MetaTagExtractorResponse>(
				metaTagExtractorUrl,
				{ url: linkUrl.toString() },
				conf
			);
			const response = await firstValueFrom(request);
			const metaData = response.data;
			return metaData;
		} catch (err) {
			// TODO: handle error
			console.log('err', err);
			throw err;
		}
	}
}
