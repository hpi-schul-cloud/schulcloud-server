import { VidisItemDto } from '@src/modules/school-license/dto';
import { MediaSchoolLicenseService } from '@src/modules/school-license/service/media-school-license.service';
import { MediaSource } from '@src/modules/mediasource/domain';
import { MediaSourceDataFormat } from '@src/modules/mediasource/enum';
import { MediaSourceForSyncNotFoundLoggableException } from '@src/modules/mediasource/loggable/media-source-for-sync-not-found-loggable.exception';
import { MediaSourceService } from '@src/modules/mediasource/service';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { lastValueFrom, Observable } from 'rxjs';
import { VidisItemMapper } from '../mapper/vidis-item.mapper';
import { VidisResponse } from '../response';
import { VidisItemResponse } from '../response/vidis-item.response';

@Injectable()
export class VidisSyncService {
	constructor(
		private readonly httpService: HttpService,
		private readonly mediaSourceService: MediaSourceService,
		private readonly mediaSchoolLicenseService: MediaSchoolLicenseService
	) {}

	public async syncMediaSchoolLicenses(): Promise<void> {
		const mediasource: MediaSource | null = await this.mediaSourceService.findByFormat(MediaSourceDataFormat.VIDIS);
		console.log('mediasource', mediasource);
		if (!mediasource) {
			throw new MediaSourceForSyncNotFoundLoggableException(MediaSourceDataFormat.VIDIS);
		}

		const items: VidisItemResponse[] = await this.fetchData(mediasource);

		const itemsDtos: VidisItemDto[] = VidisItemMapper.mapToVidisItems(items);

		await this.mediaSchoolLicenseService.syncMediaSchoolLicenses(mediasource, itemsDtos);
	}

	public async fetchData(mediaSource: MediaSource): Promise<VidisItemResponse[]> {
		if (!mediaSource.basicAuthConfig || !mediaSource.basicAuthConfig.authEndpoint) {
			throw new MediaSourceForSyncNotFoundLoggableException(MediaSourceDataFormat.VIDIS);
		}

		// TODO Encrypted password needs to be decrypted before sending the request
		const vidisResponse: VidisResponse = await this.getRequest<VidisResponse>(
			new URL(mediaSource.basicAuthConfig.authEndpoint),
			mediaSource.basicAuthConfig.username,
			mediaSource.basicAuthConfig.password
		);

		const { items } = vidisResponse;

		return items;
	}

	private async getRequest<T>(url: URL, username: string, password: string): Promise<T> {
		const observable: Observable<AxiosResponse<T>> = this.httpService.get(url.toString(), {
			headers: {
				Authorization: `Basic ${username} ${password}`,
			},
		});

		const responseToken: AxiosResponse<T> = await lastValueFrom(observable);

		return responseToken.data;
	}
}
