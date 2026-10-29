import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test, type TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { of, throwError } from 'rxjs';
import { type ReleaseEntity, ReleaseImageEntity } from '../entity';
import { RELEASES_CONFIG_TOKEN } from '../releases.config';
import { ReleaseImagesRepo, ReleasesRepo } from '../repo';
import { ReleasesService } from './release.service';
import { type GithubRelease } from './types';

describe(ReleasesService.name, () => {
	let module: TestingModule;
	let service: ReleasesService;
	let releasesRepo: DeepMocked<ReleasesRepo>;
	let releaseImagesRepo: DeepMocked<ReleaseImagesRepo>;
	let httpService: DeepMocked<HttpService>;

	const repoUrl = 'https://api.github.com/repos/test/RELEASE-NOTES/releases';

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ReleasesService,
				{ provide: ReleasesRepo, useValue: createMock<ReleasesRepo>() },
				{ provide: ReleaseImagesRepo, useValue: createMock<ReleaseImagesRepo>() },
				{ provide: HttpService, useValue: createMock<HttpService>() },
				{ provide: RELEASES_CONFIG_TOKEN, useValue: { releaseNotesRepoUrl: repoUrl } },
			],
		}).compile();

		service = module.get(ReleasesService);
		releasesRepo = module.get(ReleasesRepo);
		releaseImagesRepo = module.get(ReleaseImagesRepo);
		httpService = module.get(HttpService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	const buildGithubRelease = (body: string): GithubRelease => {
		return {
			id: 1,
			name: 'Release 1',
			body,
			html_url: 'https://github.com/test/RELEASE-NOTES/releases/1',
			author: { login: 'JohnDoe', html_url: 'https://github.com/JohnDoe' },
			created_at: '2024-01-01T00:00:00Z',
			published_at: '2024-01-02T00:00:00Z',
		};
	};

	const getSavedReleaseBody = (): string => {
		const savedRelease = releasesRepo.save.mock.calls[0][0] as ReleaseEntity;

		return savedRelease.body;
	};

	describe('getReleases', () => {
		it('should return the releases from the repo', async () => {
			releasesRepo.findReleases.mockResolvedValueOnce([[], 0]);
			const options = { pagination: { skip: 0, limit: 10 } };

			const result = await service.getReleases(options);

			expect(releasesRepo.findReleases).toHaveBeenCalledWith(options);
			expect(result).toEqual([[], 0]);
		});
	});

	describe('getImage', () => {
		it('should return the image from the repo', async () => {
			const image = new ReleaseImageEntity({ data: Buffer.from([1]), mimeType: 'image/png', sourceUrl: 'url' });
			releaseImagesRepo.findImageById.mockResolvedValueOnce(image);

			const result = await service.getImage('imageId');

			expect(releaseImagesRepo.findImageById).toHaveBeenCalledWith('imageId');
			expect(result).toBe(image);
		});
	});

	describe('fetchReleases', () => {
		describe('when the release list response is not an array', () => {
			const setup = () => {
				httpService.get.mockReturnValueOnce(of(axiosResponseFactory.build({ data: { message: 'rate limited' } })));
			};

			it('should throw and not delete existing releases or images', async () => {
				setup();

				await expect(service.fetchReleases()).rejects.toThrow('Unexpected response format when fetching releases');

				expect(releasesRepo.deleteAll).not.toHaveBeenCalled();
				expect(releaseImagesRepo.deleteAllExcept).not.toHaveBeenCalled();
			});
		});

		describe('when a release has no body', () => {
			const setup = () => {
				const githubRelease: GithubRelease = { ...buildGithubRelease(''), body: undefined };
				httpService.get.mockReturnValueOnce(of(axiosResponseFactory.build({ data: [githubRelease] })));
			};

			it('should save the release with an empty body', async () => {
				setup();

				await service.fetchReleases();

				expect(getSavedReleaseBody()).toBe('');
				expect(releaseImagesRepo.findImageIdBySourceUrl).not.toHaveBeenCalled();
			});
		});

		describe('when the image response has no content type', () => {
			const setup = () => {
				const imageUrl = 'https://example.com/no-content-type';
				const githubRelease = buildGithubRelease(`<img src="${imageUrl}">`);
				httpService.get
					.mockReturnValueOnce(of(axiosResponseFactory.build({ data: [githubRelease] })))
					.mockReturnValueOnce(of(axiosResponseFactory.build({ data: Buffer.from([1]), headers: {} })));
				releaseImagesRepo.findImageIdBySourceUrl.mockResolvedValueOnce(null);

				return { imageUrl };
			};

			it('should not store it and keep the original url', async () => {
				const { imageUrl } = setup();

				await service.fetchReleases();

				expect(releaseImagesRepo.save).not.toHaveBeenCalled();
				expect(getSavedReleaseBody()).toBe(`<img src="${imageUrl}">`);
			});
		});

		describe('when the same image is used in multiple releases', () => {
			const setup = () => {
				const imageUrl = 'https://github.com/user-attachments/assets/shared';
				const releases = [buildGithubRelease(`<img src="${imageUrl}">`), buildGithubRelease(`![alt](${imageUrl})`)];
				httpService.get.mockReturnValueOnce(of(axiosResponseFactory.build({ data: releases })));
				releaseImagesRepo.findImageIdBySourceUrl.mockResolvedValueOnce('sharedImageId');
			};

			it('should look the image up only once and link it in all releases', async () => {
				setup();

				await service.fetchReleases();

				expect(releaseImagesRepo.findImageIdBySourceUrl).toHaveBeenCalledTimes(1);
				const savedBodies = releasesRepo.save.mock.calls.map((call) => (call[0] as ReleaseEntity).body);
				expect(savedBodies).toEqual([
					'<img src="/api/v3/releases/images/sharedImageId">',
					'![alt](/api/v3/releases/images/sharedImageId)',
				]);
				expect(releaseImagesRepo.deleteAllExcept).toHaveBeenCalledWith(['sharedImageId']);
			});
		});

		describe('when fetching the release list fails', () => {
			const setup = () => {
				httpService.get.mockReturnValueOnce(throwError(() => new Error('network error')));
			};

			it('should not delete existing releases or images', async () => {
				setup();

				await expect(service.fetchReleases()).rejects.toThrow('network error');

				expect(releasesRepo.deleteAll).not.toHaveBeenCalled();
				expect(releaseImagesRepo.deleteAllExcept).not.toHaveBeenCalled();
			});
		});

		describe('when an image already exists', () => {
			const setup = () => {
				const imageUrl = 'https://github.com/user-attachments/assets/existing';
				const githubRelease = buildGithubRelease(`text <img src="${imageUrl}"> and again ![alt](${imageUrl})`);
				httpService.get.mockReturnValueOnce(of(axiosResponseFactory.build({ data: [githubRelease] })));
				releaseImagesRepo.findImageIdBySourceUrl.mockResolvedValueOnce('existingImageId');

				return { imageUrl };
			};

			it('should reuse it without downloading it again', async () => {
				const { imageUrl } = setup();

				await service.fetchReleases();

				expect(httpService.get).toHaveBeenCalledTimes(1);
				expect(httpService.get).toHaveBeenCalledWith(repoUrl);
				expect(releaseImagesRepo.findImageIdBySourceUrl).toHaveBeenCalledTimes(1);
				expect(releaseImagesRepo.findImageIdBySourceUrl).toHaveBeenCalledWith(imageUrl);
				expect(releaseImagesRepo.save).not.toHaveBeenCalled();
			});

			it('should replace all occurrences with the backend url', async () => {
				setup();

				await service.fetchReleases();

				expect(getSavedReleaseBody()).toBe(
					'text <img src="/api/v3/releases/images/existingImageId"> and again ![alt](/api/v3/releases/images/existingImageId)'
				);
			});

			it('should keep the used image and delete only unreferenced ones', async () => {
				setup();

				await service.fetchReleases();

				expect(releasesRepo.deleteAll).toHaveBeenCalledTimes(1);
				expect(releaseImagesRepo.deleteAllExcept).toHaveBeenCalledWith(['existingImageId']);
			});
		});

		describe('when an image does not exist yet', () => {
			const setup = () => {
				const imageUrl = 'https://github.com/user-attachments/assets/new';
				const githubRelease = buildGithubRelease(`<img src="${imageUrl}">`);
				const imageData = Buffer.from([1, 2, 3]);
				httpService.get
					.mockReturnValueOnce(of(axiosResponseFactory.build({ data: [githubRelease] })))
					.mockReturnValueOnce(
						of(axiosResponseFactory.build({ data: imageData, headers: { 'content-type': 'image/png' } }))
					);
				releaseImagesRepo.findImageIdBySourceUrl.mockResolvedValueOnce(null);
				releaseImagesRepo.save.mockImplementationOnce((image) => {
					(image as ReleaseImageEntity).id = 'newImageId';

					return Promise.resolve();
				});

				return { imageUrl, imageData };
			};

			it('should download and store the image', async () => {
				const { imageUrl, imageData } = setup();

				await service.fetchReleases();

				expect(httpService.get).toHaveBeenNthCalledWith(
					2,
					imageUrl,
					expect.objectContaining({ responseType: 'arraybuffer' })
				);
				expect(releaseImagesRepo.save).toHaveBeenCalledWith(
					expect.objectContaining({ data: imageData, mimeType: 'image/png', sourceUrl: imageUrl, size: 3 })
				);
				expect(getSavedReleaseBody()).toBe('<img src="/api/v3/releases/images/newImageId">');
				expect(releaseImagesRepo.deleteAllExcept).toHaveBeenCalledWith(['newImageId']);
			});
		});

		describe('when an image cannot be downloaded', () => {
			const setup = () => {
				const imageUrl = 'https://github.com/user-attachments/assets/broken';
				const githubRelease = buildGithubRelease(`<img src="${imageUrl}">`);
				httpService.get
					.mockReturnValueOnce(of(axiosResponseFactory.build({ data: [githubRelease] })))
					.mockReturnValueOnce(throwError(() => new Error('image not found')));
				releaseImagesRepo.findImageIdBySourceUrl.mockResolvedValueOnce(null);

				return { imageUrl };
			};

			it('should keep the original url and still save the release', async () => {
				const { imageUrl } = setup();

				await service.fetchReleases();

				expect(releaseImagesRepo.save).not.toHaveBeenCalled();
				expect(getSavedReleaseBody()).toBe(`<img src="${imageUrl}">`);
				expect(releaseImagesRepo.deleteAllExcept).toHaveBeenCalledWith([]);
			});
		});

		describe('when the downloaded content is not an image', () => {
			const setup = () => {
				const imageUrl = 'https://example.com/not-an-image';
				const githubRelease = buildGithubRelease(`![alt](${imageUrl})`);
				httpService.get
					.mockReturnValueOnce(of(axiosResponseFactory.build({ data: [githubRelease] })))
					.mockReturnValueOnce(
						of(axiosResponseFactory.build({ data: Buffer.from('<html>'), headers: { 'content-type': 'text/html' } }))
					);
				releaseImagesRepo.findImageIdBySourceUrl.mockResolvedValueOnce(null);

				return { imageUrl };
			};

			it('should not store it and keep the original url', async () => {
				const { imageUrl } = setup();

				await service.fetchReleases();

				expect(releaseImagesRepo.save).not.toHaveBeenCalled();
				expect(getSavedReleaseBody()).toBe(`![alt](${imageUrl})`);
			});
		});
	});
});
