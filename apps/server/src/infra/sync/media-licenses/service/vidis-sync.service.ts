import { MediaSource, MediaSourceDataFormat, MediaSourceService } from '@modules/media-source';
import {
	MediaSourceForSyncNotFoundLoggableException,
	MediaSourceBasicAuthConfigNotFoundLoggableException,
} from '@modules/media-source/loggable';
import { MediaSchoolLicenseService, MediaSchoolLicense, SchoolLicenseType } from '@modules/school-license';
import { School, SchoolService } from '@modules/school';
import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { Logger } from '@src/core/logger';
import { AxiosErrorLoggable } from '@src/core/error/loggable';
import { ObjectId } from '@mikro-orm/mongodb';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { AxiosResponse, isAxiosError } from 'axios';
import { lastValueFrom, Observable } from 'rxjs';
import { VidisResponse, VidisItemResponse } from '../response';
import { SchoolForSchoolMediaLicenseSyncNotFoundLoggable } from '../loggable';

@Injectable()
export class VidisSyncService {
	constructor(
		private readonly httpService: HttpService,
		private readonly mediaSourceService: MediaSourceService,
		private readonly mediaSchoolLicenseService: MediaSchoolLicenseService,
		private readonly schoolService: SchoolService,
		private readonly logger: Logger,
		@Inject(DefaultEncryptionService) private readonly encryptionService: EncryptionService
	) {}

	public async getVidisMediaSource(): Promise<MediaSource> {
		const mediaSource: MediaSource | null = await this.mediaSourceService.findByFormat(MediaSourceDataFormat.VIDIS);
		if (!mediaSource) {
			throw new MediaSourceForSyncNotFoundLoggableException(MediaSourceDataFormat.VIDIS);
		}

		return mediaSource;
	}

	public async getSchoolActivationsFromVidis(mediaSource: MediaSource): Promise<VidisItemResponse[]> {
		if (!mediaSource.basicAuthConfig || !mediaSource.basicAuthConfig.authEndpoint) {
			throw new MediaSourceBasicAuthConfigNotFoundLoggableException(mediaSource.id, MediaSourceDataFormat.VIDIS);
		}

		const vidisResponse: VidisResponse = await this.getRequest<VidisResponse>(
			new URL(`${mediaSource.basicAuthConfig.authEndpoint}`),
			this.encryptionService.decrypt(mediaSource.basicAuthConfig.username),
			this.encryptionService.decrypt(mediaSource.basicAuthConfig.password)
		);

		const { items } = vidisResponse;

		return items;
	}

	public async syncMediaSchoolLicenses(mediaSource: MediaSource, items: VidisItemResponse[]): Promise<void> {
		const syncItemPromises: Promise<void>[] = items.map(async (item: VidisItemResponse): Promise<void> => {
			const schoolNumbersFromVidis = item.schoolActivations.map((activation) => this.removePrefix(activation));

			let existingLicenses: MediaSchoolLicense[] =
				await this.mediaSchoolLicenseService.findMediaSchoolLicensesByMediumId(item.offerId);

			if (existingLicenses.length) {
				await this.removeNoLongerAvailableLicenses(existingLicenses, schoolNumbersFromVidis);
				existingLicenses = await this.mediaSchoolLicenseService.findMediaSchoolLicensesByMediumId(item.offerId);
			}

			const saveNewLicensesPromises: Promise<void>[] = schoolNumbersFromVidis.map(
				async (schoolNumber: string): Promise<void> => {
					const school: School | null = await this.schoolService.getSchoolByOfficialSchoolNumber(schoolNumber);

					if (!school) {
						this.logger.info(new SchoolForSchoolMediaLicenseSyncNotFoundLoggable(schoolNumber));
					} else {
						const isExistingLicense: boolean = existingLicenses.some((license: MediaSchoolLicense): boolean => {
							return license.schoolId === school.id;
						});
						if (!isExistingLicense) {
							const newLicense: MediaSchoolLicense = new MediaSchoolLicense({
								id: new ObjectId().toHexString(),
								type: SchoolLicenseType.MEDIA_LICENSE,
								schoolId: school.id,
								mediaSource,
								mediumId: item.offerId,
							});
							await this.mediaSchoolLicenseService.saveMediaSchoolLicense(newLicense);
						}
					}
				}
			);

			await Promise.all(saveNewLicensesPromises);
		});

		await Promise.all(syncItemPromises);
	}

	private async getRequest<T>(url: URL, username: string, password: string): Promise<T> {
		const encodedCredentials = btoa(`${username}:${password}`);
		const observable: Observable<AxiosResponse<T>> = this.httpService.get(url.toString(), {
			headers: {
				Authorization: `Basic ${encodedCredentials}`,
				'Content-Type': 'application/json',
			},
		});

		try {
			const responseToken: AxiosResponse<T> = await lastValueFrom(observable);
			return responseToken.data;
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				throw new AxiosErrorLoggable(error, 'VIDIS_GET_SCHOOL_ACTIVATIONS_FAILED');
			} else {
				throw error;
			}
		}
	}

	private removePrefix(input: string): string {
		return input.replace(/^.*?(\d{5})$/, '$1');
	}

	private async removeNoLongerAvailableLicenses(
		existingLicenses: MediaSchoolLicense[],
		schoolNumbersFromVidis: string[]
	): Promise<void> {
		const vidisSchoolNumberSet = new Set(schoolNumbersFromVidis);

		const removalPromises: Promise<void>[] = existingLicenses.map(async (license: MediaSchoolLicense) => {
			const school = await this.schoolService.getSchoolById(license.schoolId);
			if (!school.officialSchoolNumber) {
				return;
			}

			const isLicenseNoLongerInVidis = !vidisSchoolNumberSet.has(school.officialSchoolNumber);
			if (isLicenseNoLongerInVidis) {
				await this.mediaSchoolLicenseService.deleteSchoolLicense(license);
			}
		});

		await Promise.all(removalPromises);
	}
}
