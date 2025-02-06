import { createMock } from '@golevelup/ts-jest';
import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { MediaSource } from '@modules/media-source';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';
import { OauthAdapterService, OAuthTokenDto } from '../../oauth-adapter';
import { BiloMediaQueryBodyParams } from '../domain/request';
import { BiloMediaQueryResponse } from '../domain/response';
import { BiloLinkResponse } from '../domain/response/bilo-link.response';
import { mediaSourceFactory } from '../testing';
import { BiloMediaFetchService } from './bilo-media-fetch.service';

jest.mock('@nestjs/axios');

describe('BiloMediaFetchService', () => {
	let service: BiloMediaFetchService;
	let httpService: HttpService;
	let oauthAdapterService: OauthAdapterService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				BiloMediaFetchService,
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
				{
					provide: OauthAdapterService,
					useValue: createMock<OauthAdapterService>(),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<EncryptionService>(),
				},
			],
		}).compile();

		service = module.get(BiloMediaFetchService);
		httpService = module.get(HttpService);
		oauthAdapterService = module.get(OauthAdapterService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('fetchMediaMetadata', () => {
		const setup = () => {
			const mediumIds = ['123', '456'];
			const mediaSource: MediaSource = mediaSourceFactory.withBildungslogin().build();

			const mockToken = new OAuthTokenDto({
				accessToken: 'mockAccessToken',
				idToken: 'mockIdToken',
				refreshToken: 'mockRefreshToken',
			});

			const mockResponseData: BiloMediaQueryResponse[] = [
				{
					id: '123',
					title: 'Media 1',
					author: 'Author 1',
					description: 'Description 1',
					publisher: 'Publisher 1',
					cover: { href: 'https://cover.example.com/123' } as BiloLinkResponse,
					coverSmall: { href: 'https://cover.example.com/small/123' } as BiloLinkResponse,
					modified: 1700000000,
				},
				{
					id: '456',
					title: 'Media 2',
					author: 'Author 2',
					description: 'Description 2',
					publisher: 'Publisher 2',
					cover: { href: 'https://cover.example.com/456' } as BiloLinkResponse,
					coverSmall: { href: 'https://cover.example.com/small/456' } as BiloLinkResponse,
					modified: 1700000001,
				},
			];

			const mockAxiosResponse = axiosResponseFactory.build({
				data: mockResponseData,
			}) as AxiosResponse<BiloMediaQueryResponse[]>;

			jest.spyOn(oauthAdapterService, 'sendTokenRequest').mockResolvedValue(mockToken);
			jest.spyOn(httpService, 'post').mockReturnValue(of(mockAxiosResponse));

			return {
				mediumIds,
				mediaSource,
				mockResponseData,
			};
		};

		it('should fetch media metadata successfully', async () => {
			const { mediumIds, mediaSource, mockResponseData } = setup();

			const result = await service.fetchMediaMetadata(mediumIds, mediaSource);

			expect(result).toEqual(mockResponseData);
		});

		it('should fetch correct media metadata successfully', async () => {
			const { mediumIds, mediaSource } = setup();

			const result = await service.fetchMediaMetadata(mediumIds, mediaSource);

			expect(result[0]).toMatchObject({
				id: '123',
				title: 'Media 1',
				author: 'Author 1',
				description: 'Description 1',
				publisher: 'Publisher 1',
				cover: { href: 'https://cover.example.com/123' } as BiloLinkResponse,
				coverSmall: { href: 'https://cover.example.com/small/123' } as BiloLinkResponse,
				modified: 1700000000,
			});
		});

		it('should call oauth adapter', async () => {
			const { mediumIds, mediaSource } = setup();

			await service.fetchMediaMetadata(mediumIds, mediaSource);
			expect(oauthAdapterService.sendTokenRequest).toHaveBeenCalled();
		});

		it('should call https service with correct params and headers', async () => {
			const { mediumIds, mediaSource } = setup();

			await service.fetchMediaMetadata(mediumIds, mediaSource);
			expect(httpService.post).toHaveBeenCalledWith(
				new URL(`${mediaSource.sourceId}/query`).toString(),
				expect.arrayContaining([expect.any(BiloMediaQueryBodyParams)]),
				expect.objectContaining({
					headers: {
						Authorization: `Bearer mockAccessToken`,
						'Content-Type': 'application/vnd.de.bildungslogin.mediaquery+json',
					},
				})
			);
		});

		it('should throw an error if oauthConfig is missing', async () => {
			const mediumIds = ['123'];
			const mediaSource: MediaSource = { sourceId: 'https://api.example.com/media' } as MediaSource;

			await expect(service.fetchMediaMetadata(mediumIds, mediaSource)).rejects.toThrowError();
		});
	});
});
