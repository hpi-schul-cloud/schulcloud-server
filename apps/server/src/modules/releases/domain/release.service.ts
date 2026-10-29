import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { IFindOptions } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { firstValueFrom } from 'rxjs';
import { ReleaseEntity, ReleaseImageEntity } from '../entity';
import { RELEASES_CONFIG_TOKEN, ReleasesConfig } from '../releases.config';
import { ReleaseImagesRepo, ReleasesRepo } from '../repo';
import { GithubRelease, Release } from './types';

@Injectable()
export class ReleasesService {
	private static readonly MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

	private static readonly IMAGE_BASE_PATH = '/api/v3/releases/images';

	constructor(
		private readonly releasesRepo: ReleasesRepo,
		private readonly releaseImagesRepo: ReleaseImagesRepo,
		private readonly httpService: HttpService,
		@Inject(RELEASES_CONFIG_TOKEN) private readonly config: ReleasesConfig
	) {}

	public async getReleases(options?: IFindOptions<ReleaseEntity>): Promise<Counted<Release[]>> {
		const result = await this.releasesRepo.findReleases(options);

		return result;
	}

	public async getImage(imageId: EntityId): Promise<ReleaseImageEntity> {
		const image = await this.releaseImagesRepo.findImageById(imageId);

		return image;
	}

	public async fetchReleases(): Promise<void> {
		const githubReleases = await this.fetchFromRepository(this.config.releaseNotesRepoUrl);

		await this.releasesRepo.deleteAll();

		// source url -> image id (or null if the image could not be stored); avoids repeated lookups within one fetch
		const imageIdsBySourceUrl = new Map<string, EntityId | null>();

		// sequential on purpose: keeps memory and db load low
		for (const githubRelease of githubReleases) {
			const body = await this.replaceImagesWithBackendUrls(githubRelease.body ?? '', imageIdsBySourceUrl);
			const entity = this.createReleaseEntity(githubRelease, body);

			await this.releasesRepo.save(entity);
		}

		// images are kept between fetches; only remove those no longer referenced by any release
		const usedImageIds = [...imageIdsBySourceUrl.values()].filter((id): id is EntityId => id !== null);
		await this.releaseImagesRepo.deleteAllExcept(usedImageIds);
	}

	private createReleaseEntity(release: GithubRelease, body: string): ReleaseEntity {
		const entity = new ReleaseEntity({
			name: release.name,
			body,
			url: release.html_url,
			author: release.author.login,
			authorUrl: release.author.html_url,
			createdAt: new Date(release.created_at),
			publishedAt: new Date(release.published_at),
			zipUrl: release.zipball_url,
		});

		return entity;
	}

	private async replaceImagesWithBackendUrls(
		body: string,
		imageIdsBySourceUrl: Map<string, EntityId | null>
	): Promise<string> {
		const htmlImageUrls = [...body.matchAll(/<img[^>]+src="([^">]+)"/g)].map((match) => match[1]);
		const markdownImageUrls = [...body.matchAll(/!\[[^\]]*\]\((\S+?)(?:\s+"[^"]*")?\)/g)].map((match) => match[1]);
		const urls = new Set([...htmlImageUrls, ...markdownImageUrls]);

		let result = body;
		for (const url of urls) {
			let imageId = imageIdsBySourceUrl.get(url);
			if (imageId === undefined) {
				imageId = await this.safeGetOrStoreImage(url);
				imageIdsBySourceUrl.set(url, imageId);
			}

			// keep the original url if the image could not be stored
			const imageUrl = imageId ? `${ReleasesService.IMAGE_BASE_PATH}/${imageId}` : url;
			result = result.split(url).join(imageUrl);
		}

		return result;
	}

	/**
	 * Returns the id of the stored image, or null if the image could not be loaded,
	 * so a single broken image does not break the whole release fetch.
	 */
	private async safeGetOrStoreImage(sourceUrl: string): Promise<EntityId | null> {
		try {
			const existingImageId = await this.releaseImagesRepo.findImageIdBySourceUrl(sourceUrl);
			const imageId = existingImageId ?? (await this.storeImage(sourceUrl));

			return imageId;
		} catch {
			return null;
		}
	}

	private async storeImage(imageUrl: string): Promise<EntityId> {
		const response = await firstValueFrom(
			this.httpService.get<ArrayBuffer>(imageUrl, {
				responseType: 'arraybuffer',
				maxContentLength: ReleasesService.MAX_IMAGE_SIZE_BYTES,
			})
		);

		const mimeType = String(response.headers['content-type'] ?? '');
		if (!mimeType.startsWith('image/')) {
			throw new Error(`Unexpected content type "${mimeType}" for release image`);
		}

		const image = new ReleaseImageEntity({ data: Buffer.from(response.data), mimeType, sourceUrl: imageUrl });
		await this.releaseImagesRepo.save(image);

		return image.id;
	}

	private async fetchFromRepository(url: string): Promise<GithubRelease[]> {
		const response = await firstValueFrom(this.httpService.get<GithubRelease[]>(url));

		if (!Array.isArray(response.data)) {
			throw new Error('Unexpected response format when fetching releases');
		}

		return response.data;
	}
}
