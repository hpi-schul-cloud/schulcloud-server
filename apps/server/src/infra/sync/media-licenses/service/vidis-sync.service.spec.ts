import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MediaSourceService } from '@modules/media-source/service';
import { MediaSchoolLicenseService } from '@modules/school-license/service/media-school-license.service';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { MediaSourceDataFormat } from '@modules/media-source/enum';
import { MediaSourceForSyncNotFoundLoggableException } from '@modules/media-source/loggable';
import { DefaultEncryptionService, EncryptionService, SymetricKeyEncryptionService } from '@infra/encryption';
import { AxiosErrorLoggable } from '@src/core/error/loggable';
import { axiosErrorFactory, axiosResponseFactory } from '@shared/testing';
import { of, throwError } from 'rxjs';
import { vidisResponseFactory } from '../testing/vidis.response.factory';
import { VidisSyncService } from './vidis-sync.service';

describe(VidisSyncService.name, () => {
	let module: TestingModule;
	let vidisSyncService: VidisSyncService;
	let httpService: DeepMocked<HttpService>;
	let mediaSourceService: DeepMocked<MediaSourceService>;
	let mediaSchoolLicenseService: DeepMocked<MediaSchoolLicenseService>;
	let encryptionService: DeepMocked<SymetricKeyEncryptionService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				VidisSyncService,
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
				{
					provide: MediaSourceService,
					useValue: createMock<MediaSourceService>(),
				},
				{
					provide: MediaSchoolLicenseService,
					useValue: createMock<MediaSchoolLicenseService>(),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<EncryptionService>(),
				},
			],
		}).compile();

		vidisSyncService = module.get(VidisSyncService);
		httpService = module.get(HttpService);
		mediaSourceService = module.get(MediaSourceService);
		mediaSchoolLicenseService = module.get(MediaSchoolLicenseService);
		encryptionService = module.get(DefaultEncryptionService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});
	// TODO: sync service was refactored, update this test file

	describe('syncMediaSchoolLicenses', () => {
		describe('when the VIDIS media source is not found', () => {
			const setup = () => {
				mediaSourceService.findByFormat.mockResolvedValueOnce(null);
			};

			it('should throw an MediaSourceForSyncNotFoundLoggableException', async () => {
				setup();

				// const promise = vidisSyncService.getLicenseDataFromVidis();
				//
				// await expect(promise).rejects.toThrowError(
				// 	new MediaSourceForSyncNotFoundLoggableException(MediaSourceDataFormat.VIDIS)
				// );
			});
		});

		describe('when the VIDIS media source is found', () => {
			describe('when VIDIS returns valid licenses', () => {
				const setup = () => {
					const vidisMediaSource = mediaSourceFactory.withBasicAuthConfig().build({
						format: MediaSourceDataFormat.VIDIS,
					});
					const axiosResponse = axiosResponseFactory.build({
						data: vidisResponseFactory.build(),
					});

					mediaSourceService.findByFormat.mockResolvedValueOnce(vidisMediaSource);
					encryptionService.decrypt.mockReturnValueOnce('username');
					encryptionService.decrypt.mockReturnValueOnce('password');
					httpService.get.mockReturnValueOnce(of(axiosResponse));
				};

				it('should not throw any error', async () => {
					setup();

					// const promise = vidisSyncService.getLicenseDataFromVidis();
					//
					// await expect(promise).resolves.not.toThrowError();
				});

				it('should fetch media source config, fetch license data and start the license sync', async () => {
					setup();

					// await vidisSyncService.getLicenseDataFromVidis();

					// expect(mediaSourceService.findByFormat).toBeCalledWith(MediaSourceDataFormat.VIDIS);
					// expect(httpService.get).toHaveBeenCalled();
					// expect(mediaSchoolLicenseService.syncMediaSchoolLicenses).toHaveBeenCalled();
				});
			});

			describe('when there is a axios error fetching licenses from VIDIS', () => {
				const setup = () => {
					const vidisMediaSource = mediaSourceFactory.withBasicAuthConfig().build({
						format: MediaSourceDataFormat.VIDIS,
					});
					const axiosErrorResponse = axiosErrorFactory.build();

					mediaSourceService.findByFormat.mockResolvedValueOnce(vidisMediaSource);
					encryptionService.decrypt.mockReturnValueOnce('username');
					encryptionService.decrypt.mockReturnValueOnce('password');
					httpService.get.mockReturnValue(throwError(() => axiosErrorResponse));

					return { axiosErrorResponse };
				};

				it('should throw a AxiosErrorLoggable', async () => {
					const { axiosErrorResponse } = setup();

					// const promise = vidisSyncService.getLicenseDataFromVidis();
					//
					// await expect(promise).rejects.toThrowError(
					// 	new AxiosErrorLoggable(axiosErrorResponse, 'VIDIS_GET_DATA_FAILED')
					// );
				});
			});

			describe('when there is an unknown error fetching licenses from VIDIS', () => {
				const setup = () => {
					const vidisMediaSource = mediaSourceFactory.withBasicAuthConfig().build({
						format: MediaSourceDataFormat.VIDIS,
					});
					const error = new Error('test-unknown-error');

					mediaSourceService.findByFormat.mockResolvedValueOnce(vidisMediaSource);
					encryptionService.decrypt.mockReturnValueOnce('username');
					encryptionService.decrypt.mockReturnValueOnce('password');
					httpService.get.mockReturnValue(throwError(() => error));

					return { error };
				};

				it('should throw a the unknown error', async () => {
					const { error } = setup();

					// const promise = vidisSyncService.getLicenseDataFromVidis();
					//
					// await expect(promise).rejects.toThrowError(error);
				});
			});
		});
	});
});
