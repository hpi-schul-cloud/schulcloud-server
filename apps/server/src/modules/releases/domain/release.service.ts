import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { IFindOptions } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { ReleaseEntity, ReleaseImageEntity } from '../entity';
import { RELEASES_CONFIG_TOKEN, ReleasesConfig } from '../releases.config';
import { ReleaseImagesRepo, ReleasesRepo } from '../repo';
import { GithubRelease, Release } from './types';

@Injectable()
export class ReleasesService {
	private static readonly MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

	private static readonly IMAGE_BASE_PATH = '/api/v3/releases/images';

	/**
	 * Redirects must be supported because images added via drag & drop in the GitHub release editor
	 * (https://github.com/user-attachments/assets/...) respond with a 302 to a S3 url
	 */
	private static readonly MAX_IMAGE_REDIRECTS = 3;

	private static readonly UNUSED_IMAGE_GRACE_PERIOD_MS = 60 * 60 * 1000;

	// groups: 1 = prefix, 2 = image url, 3 = suffix
	private static readonly HTML_IMAGE_REGEX = /(<img[^>]+src=")([^">]+)(")/g;

	private static readonly MARKDOWN_IMAGE_REGEX = /(!\[[^\]]*\]\()(\S+?)((?:\s+"[^"]*")?\))/g;

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

	/**
	 * Safe to run concurrently (also across instances): releases are upserted by their github id and
	 * unused images are determined from all stored releases instead of only the ones of this fetch.
	 */
	public async fetchReleases(): Promise<void> {
		const githubReleases = await this.fetchFromRepository(this.config.releaseNotesRepoUrl);

		// source url -> image id (or null if the image could not be stored); avoids repeated lookups within one fetch
		const imageIdsBySourceUrl = new Map<string, EntityId | null>();

		// sequential on purpose: keeps memory and db load low
		for (const githubRelease of githubReleases) {
			const { body, imageIds } = await this.replaceImagesWithBackendUrls(githubRelease.body ?? '', imageIdsBySourceUrl);
			const entity = this.createReleaseEntity(githubRelease, body, imageIds);

			await this.releasesRepo.upsertByGithubId(entity);
		}

		await this.releasesRepo.deleteAllExceptGithubIds(githubReleases.map((release) => release.id));
		await this.deleteUnusedImages();
	}

	private async deleteUnusedImages(): Promise<void> {
		const usedImageIds = await this.releasesRepo.findAllImageIds();
		// recently used images may belong to a concurrent fetch whose release is not saved yet
		const unusedSince = new Date(Date.now() - ReleasesService.UNUSED_IMAGE_GRACE_PERIOD_MS);

		await this.releaseImagesRepo.deleteUnusedImages(usedImageIds, unusedSince);
	}

	private createReleaseEntity(release: GithubRelease, body: string, imageIds: EntityId[]): ReleaseEntity {
		const entity = new ReleaseEntity({
			githubId: release.id,
			name: release.name,
			body,
			url: release.html_url,
			author: release.author.login,
			authorUrl: release.author.html_url,
			createdAt: new Date(release.created_at),
			publishedAt: new Date(release.published_at),
			zipUrl: release.zipball_url,
			imageIds,
		});

		return entity;
	}

	private async replaceImagesWithBackendUrls(
		body: string,
		imageIdsBySourceUrl: Map<string, EntityId | null>
	): Promise<{ body: string; imageIds: EntityId[] }> {
		const urls = new Set(
			[ReleasesService.HTML_IMAGE_REGEX, ReleasesService.MARKDOWN_IMAGE_REGEX].flatMap((regex) =>
				[...body.matchAll(regex)].map((match) => match[2])
			)
		);

		for (const url of urls) {
			if (!imageIdsBySourceUrl.has(url)) {
				imageIdsBySourceUrl.set(url, await this.safeGetOrStoreImage(url));
			}
		}

		// only the captured image destinations are replaced, so links and urls sharing a prefix stay untouched
		const replaceDestination = (_match: string, prefix: string, url: string, suffix: string): string => {
			const imageId = imageIdsBySourceUrl.get(url);
			// keep the original url if the image could not be stored
			const imageUrl = imageId ? `${ReleasesService.IMAGE_BASE_PATH}/${imageId}` : url;

			return `${prefix}${imageUrl}${suffix}`;
		};

		const result = body
			.replace(ReleasesService.HTML_IMAGE_REGEX, replaceDestination)
			.replace(ReleasesService.MARKDOWN_IMAGE_REGEX, replaceDestination);
		const imageIds = [...urls]
			.map((url) => imageIdsBySourceUrl.get(url))
			.filter((id): id is EntityId => typeof id === 'string');

		return { body: result, imageIds: [...new Set(imageIds)] };
	}

	/**
	 * Returns the id of the stored image, or null if the image could not be loaded,
	 * so a single broken image does not break the whole release fetch.
	 */
	private async safeGetOrStoreImage(sourceUrl: string): Promise<EntityId | null> {
		try {
			const existingImageId = await this.releaseImagesRepo.markImageUsed(sourceUrl);
			const imageId = existingImageId ?? (await this.storeImage(sourceUrl));

			return imageId;
		} catch {
			return null;
		}
	}

	private async storeImage(imageUrl: string): Promise<EntityId> {
		const response = await this.downloadImage(imageUrl);

		const mimeType = String(response.headers['content-type'] ?? '');
		if (!mimeType.startsWith('image/')) {
			throw new Error(`Unexpected content type "${mimeType}" for release image`);
		}

		const image = new ReleaseImageEntity({ data: Buffer.from(response.data), mimeType, sourceUrl: imageUrl });
		await this.releaseImagesRepo.save(image);

		return image.id;
	}

	private async downloadImage(sourceUrl: string): Promise<AxiosResponse<ArrayBuffer>> {
		let url = new URL(sourceUrl);

		for (let redirects = 0; redirects <= ReleasesService.MAX_IMAGE_REDIRECTS; redirects++) {
			if (!this.isAllowedImageUrl(url)) {
				throw new Error(`Release image source not allowed: ${url.origin}${url.pathname}`);
			}

			const response = await firstValueFrom(
				this.httpService.get<ArrayBuffer>(url.toString(), {
					responseType: 'arraybuffer',
					maxContentLength: ReleasesService.MAX_IMAGE_SIZE_BYTES,
					maxRedirects: 0,
					// accept 3xx so redirects are returned to the loop below instead of being thrown by axios
					validateStatus: (status) => status >= 200 && status < 400,
					timeout: 10_000,
				})
			);

			if (response.status < 300) {
				return response;
			}

			const { location } = response.headers as { location?: unknown };
			if (typeof location !== 'string' || location === '') {
				throw new Error('Release image redirect without location');
			}

			url = new URL(location, url);
		}

		throw new Error('Too many redirects for release image');
	}

	private isAllowedImageUrl(url: URL): boolean {
		if (url.username || url.password) {
			return false;
		}

		// URL parsing normalizes the path (e.g. "..", "%2e%2e"), so prefix matching cannot be escaped via traversal
		const isAllowed = this.config.releaseImageAllowedSources
			.map((source) => new URL(source))
			.some((allowed) => url.origin === allowed.origin && url.pathname.startsWith(allowed.pathname));

		return isAllowed;
	}

	private async fetchFromRepository(url: string): Promise<GithubRelease[]> {
		const response = await firstValueFrom(this.httpService.get<GithubRelease[]>(url));

		if (!Array.isArray(response.data)) {
			throw new Error('Unexpected response format when fetching releases');
		}

		return response.data;
	}
}
