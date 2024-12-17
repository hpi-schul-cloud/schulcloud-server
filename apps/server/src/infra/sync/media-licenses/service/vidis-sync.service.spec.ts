import { MediaSourceService, MediaSourceDataFormat } from '@modules/media-source';
import {
	MediaSourceBasicAuthConfigNotFoundLoggableException,
	MediaSourceForSyncNotFoundLoggableException,
} from '@modules/media-source/loggable';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { MediaSchoolLicenseService } from '@modules/school-license/service/media-school-license.service';
import { SchoolService } from '@modules/school';
import { axiosResponseFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { DefaultEncryptionService, EncryptionService, SymetricKeyEncryptionService } from '@infra/encryption';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { vidisResponseFactory } from '../testing/vidis.response.factory';
import { VidisResponse } from '../response';
import { VidisSyncService } from './vidis-sync.service';

describe(VidisSyncService.name, () => {
	let module: TestingModule;
	let vidisSyncService: VidisSyncService;
	let httpService: DeepMocked<HttpService>;
	let mediaSourceService: DeepMocked<MediaSourceService>;
	let mediaSchoolLicenseService: DeepMocked<MediaSchoolLicenseService>;
	let schoolService: DeepMocked<SchoolService>;
	let logger: DeepMocked<Logger>;
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
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
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
		schoolService = module.get(SchoolService);
		logger = module.get(Logger);
		encryptionService = module.get(DefaultEncryptionService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	// TODO: incomplete
	describe('getVidisMediaSource', () => {
		describe('when the vidis media source exists', () => {
			const setup = () => {
				const vidisMediaSource = mediaSourceFactory.build({ format: MediaSourceDataFormat.VIDIS });

				mediaSourceService.findByFormat.mockResolvedValueOnce(vidisMediaSource);

				return {
					vidisMediaSource,
				};
			};

			it('should find the media source by format', async () => {
				setup();

				await vidisSyncService.getVidisMediaSource();

				expect(mediaSourceService.findByFormat).toBeCalledWith(MediaSourceDataFormat.VIDIS);
			});

			it('should return the vidis media source', async () => {
				const { vidisMediaSource } = setup();

				const result = await vidisSyncService.getVidisMediaSource();

				expect(result).toEqual(vidisMediaSource);
			});
		});

		describe('when the vidis media source does not exist', () => {
			const setup = () => {
				mediaSourceService.findByFormat.mockResolvedValueOnce(null);
			};

			it('should throw an MediaSourceForSyncNotFoundLoggableException', async () => {
				setup();

				const promise = vidisSyncService.getVidisMediaSource();

				await expect(promise).rejects.toThrow(
					new MediaSourceForSyncNotFoundLoggableException(MediaSourceDataFormat.VIDIS)
				);
			});
		});
	});

	describe('getSchoolActivationsFromVidis', () => {
		describe('when the provided media source has a valid basic auth config', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.withBasicAuthConfig().build();
				const axiosResponse: AxiosResponse<VidisResponse> = axiosResponseFactory.build({
					data: vidisResponseFactory.build(),
				});

				httpService.get.mockReturnValueOnce(of(axiosResponse));

				return {
					mediaSource,
					axiosResponse,
				};
			};

			it('should return school activations from vidis', async () => {
				const { mediaSource, axiosResponse } = setup();

				// const result = await vidisSyncService.getSchoolActivationsFromVidis(mediaSource);
				//
				// expect(result).toEqual(axiosResponse.data);
			});
		});

		describe('when the provided media source has no basic auth config', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.build({ basicAuthConfig: undefined });

				return {
					mediaSource,
				};
			};

			it('should throw an MediaSourceBasicAuthConfigNotFoundLoggableException', async () => {
				const { mediaSource } = setup();

				const promise = vidisSyncService.getSchoolActivationsFromVidis(mediaSource);

				await expect(promise).rejects.toThrow(
					new MediaSourceBasicAuthConfigNotFoundLoggableException(mediaSource.id, MediaSourceDataFormat.VIDIS)
				);
			});
		});
	});

	// describe('syncMediaSchoolLicenses', () => {});
});
