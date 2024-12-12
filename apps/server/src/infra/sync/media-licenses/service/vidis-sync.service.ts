import { VidisItemDto } from '@src/modules/school-license/dto';
import { MediaSchoolLicenseService } from '@src/modules/school-license/service/media-school-license.service';
import { MediaSource } from '@src/modules/mediasource/domain';
import { MediaSourceDataFormat } from '@src/modules/mediasource/enum';
import { MediaSourceForSyncNotFoundLoggableException } from '@src/modules/mediasource/loggable';
import { MediaSourceService } from '@src/modules/mediasource/service';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { lastValueFrom, Observable } from 'rxjs';
import { VidisItemMapper } from '../mapper/vidis-item.mapper';
import { VidisResponse } from '../response';
import { VidisItemResponse } from '../response/vidis-item.response';
import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';

@Injectable()
export class VidisSyncService {
	constructor(
		private readonly httpService: HttpService,
		private readonly mediaSourceService: MediaSourceService,
		private readonly mediaSchoolLicenseService: MediaSchoolLicenseService,
		@Inject(DefaultEncryptionService) private readonly encryptionService: EncryptionService
	) {}

	public async syncMediaSchoolLicenses(): Promise<void> {
		const mediasource: MediaSource | null = await this.mediaSourceService.findByFormat(MediaSourceDataFormat.VIDIS);
		if (!mediasource) {
			throw new MediaSourceForSyncNotFoundLoggableException(MediaSourceDataFormat.VIDIS);
		}

		const items: VidisItemResponse[] = await this.fetchData(mediasource);

		const itemsDtos: VidisItemDto[] = VidisItemMapper.mapToVidisItems(items);

		await this.mediaSchoolLicenseService.syncMediaSchoolLicenses(mediasource, itemsDtos);
	}

	// FIXME: clarify; is there a reason why this is public?
	public async fetchData(mediaSource: MediaSource): Promise<VidisItemResponse[]> {
		if (!mediaSource.basicAuthConfig || !mediaSource.basicAuthConfig.authEndpoint) {
			throw new MediaSourceForSyncNotFoundLoggableException(MediaSourceDataFormat.VIDIS);
		}

		// TODO: throw a vidis-specific error to make debugging easier
		const vidisResponse: VidisResponse = await this.getRequest<VidisResponse>(
			new URL(`${mediaSource.basicAuthConfig.authEndpoint}`),
			this.encryptionService.decrypt(mediaSource.basicAuthConfig.username),
			this.encryptionService.decrypt(mediaSource.basicAuthConfig.password)
		);

		const { items } = vidisResponse;

		return items;
	}

	private async getRequest<T>(url: URL, username: string, password: string): Promise<T> {
		const encodedCredentials = btoa(`${username}:${password}`);
		const observable: Observable<AxiosResponse<T>> = this.httpService.get(url.toString(), {
			headers: {
				Authorization: `Basic ${encodedCredentials}`,
				'Content-Type': 'application/json',
			},
		});

		const responseToken: AxiosResponse<T> = await lastValueFrom(observable);

		return responseToken.data;
	}
}
