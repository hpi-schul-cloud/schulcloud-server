import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@src/core/logger';
import { DefaultEncryptionService, EncryptionService, SymetricKeyEncryptionService } from '@infra/encryption';
import { mediaSourceFactory } from '@modules/media-source/testing';
import { MediaSourceDataFormat, MediaSourceService } from '@modules/media-source';
import { MediaSchoolLicenseService } from '@modules/school-license';
import { SchoolService } from '@modules/school';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { vidisResponseFactory } from '../testing';
import { VidisSyncService } from './vidis-sync.service';

describe(`${VidisSyncService.name} Integration`, () => {
	let module: TestingModule;
	let axiosMock: MockAdapter;
	let service: VidisSyncService;
	let encryptionService: DeepMocked<SymetricKeyEncryptionService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [HttpModule],
			providers: [
				VidisSyncService,
				{ provide: MediaSchoolLicenseService, useValue: createMock<MediaSchoolLicenseService>() },
				{ provide: SchoolService, useValue: createMock<SchoolService>() },
				{ provide: MediaSourceService, useValue: createMock<MediaSourceService>() },
				{ provide: Logger, useValue: createMock<Logger>() },
				{ provide: DefaultEncryptionService, useValue: createMock<EncryptionService>() },
			],
		}).compile();

		service = module.get(VidisSyncService);
		encryptionService = module.get(DefaultEncryptionService);
		axiosMock = new MockAdapter(axios);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getSchoolActivationsFromVidis', () => {
		describe('when the vidis media source is passed', () => {
			const setup = () => {
				const mediaSource = mediaSourceFactory.withBasicAuthConfig().build({ format: MediaSourceDataFormat.VIDIS });
				const vidisResponse = vidisResponseFactory.build();

				encryptionService.decrypt.mockReturnValueOnce('username');
				encryptionService.decrypt.mockReturnValueOnce('password');

				axiosMock.onGet().replyOnce(HttpStatus.OK, vidisResponse);

				return { mediaSource, vidisResponse };
			};

			it('should return the school activation items from vidis', async () => {
				const { mediaSource, vidisResponse } = setup();

				const items = await service.getSchoolActivationsFromVidis(mediaSource);

				expect(items).toEqual(vidisResponse.items);
			});
		});
	});
});
