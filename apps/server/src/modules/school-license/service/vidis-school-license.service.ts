import { VidisItemResponse } from '@infra/sync/media-licenses/response/vidis-item.response';
import { VidisResponse } from '@infra/sync/media-licenses/response/vidis.response';
import { MediaSource } from '@modules/mediasource/domain';
import { MediaSourceDataFormat } from '@modules/mediasource/enum';
import { MediaSourceService } from '@modules/mediasource/service';
import { SchoolService } from '@modules/school';
import { MediaSchoolLicenseService } from '@modules/school-license/service/school-license.service';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { lastValueFrom, Observable } from 'rxjs';
import { Logger } from '@src/core/logger';
import { MediaSourceForSyncNotFoundLoggableException } from '../../mediasource/loggable/media-source-for-sync-not-found-loggable.exception';
import { MediaSchoolLicense } from '../domain';
import { SchoolForSchoolMediaLicenseSyncNotFoundLoggable } from '../loggable/school-for-school-media-license-sync-not-found.loggable';

@Injectable()
export class VidisSyncService {
	constructor(
		private readonly httpsService: HttpService,
		private readonly mediaSourceService: MediaSourceService,
		private readonly mediaSchoolLicenseService: MediaSchoolLicenseService,
		private readonly schoolService: SchoolService,
		private readonly logger: Logger
	) {}

	public async fetchDatafromMediaSource() {
		const mediasource: MediaSource | null = await this.mediaSourceService.findByName(MediaSourceDataFormat.VIDIS);

		if (!mediasource) {
			throw new MediaSourceForSyncNotFoundLoggableException(MediaSourceDataFormat.VIDIS);
		}

		if (mediasource.basicAuthConfig?.authEndpoint) {
			const vidisResponse: VidisResponse = await this.getRequest<VidisResponse>(
				new URL(mediasource.basicAuthConfig.authEndpoint),
				mediasource.basicAuthConfig.username,
				mediasource.basicAuthConfig.password
			);

			const { items } = vidisResponse;
			items.map(async (item: VidisItemResponse) => {
				const { schoolActivations } = item;
				const schoolActivationsSet = new Set(schoolActivations.map((activation) => this.removePrefix(activation)));
				const mediumId = item.offerId;

				const existingMediaSchoolLicenses: MediaSchoolLicense[] =
					await this.mediaSchoolLicenseService.findMediaSchoolLicensesByMediumId(mediumId);

				// delete existing licenses that are not in the schoolActivations

				for await (const license of existingMediaSchoolLicenses) {
					const school = await this.schoolService.getSchoolById(license.schoolId);
					if (!schoolActivationsSet.has(school.officialSchoolNumber ?? '')) {
						await this.mediaSchoolLicenseService.deleteSchoolLicense(license);
					}
				}

				schoolActivations.map(async (activation) => {
					const school = await this.schoolService.getSchoolByOfficialSchoolNumber(this.removePrefix(activation));

					if (!school) {
						this.logger.info(new SchoolForSchoolMediaLicenseSyncNotFoundLoggable(activation));
					}

					const existingMediaSchoolLicense = await this.mediaSchoolLicenseService.findMediaSchoolLicense(
						mediasource,
						school.id,
						mediumId
					);

					if (!existingMediaSchoolLicense) {
						const newSchoolMediaLicense: MediaSchoolLicense = await this.mediaSchoolLicenseService.buildLicense(
							mediasource,
							school.id,
							mediumId
						);
						await this.mediaSchoolLicenseService.saveSchoolLicense(newSchoolMediaLicense);
					}
				});
			});
		}
	}

	private async getRequest<T>(url: URL, username: string, password: string): Promise<T> {
		const observable: Observable<AxiosResponse<T>> = this.httpsService.get(url.toString(), {
			headers: {
				Authorization: `Basic ${username} ${password}`,
			},
		});

		const responseToken: AxiosResponse<T> = await lastValueFrom(observable);

		return responseToken.data;
	}

	private removePrefix(input: string): string {
		return input.replace(/^.*?(\d{5})$/, '$1');
	}
}
