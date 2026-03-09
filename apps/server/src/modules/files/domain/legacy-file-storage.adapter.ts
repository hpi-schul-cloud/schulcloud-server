import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { firstValueFrom } from 'rxjs';
import { LEGACY_FILE_ARCHIVE_CONFIG_TOKEN, LegacyFileArchiveConfig } from '../legacy-file-archive.config';
import { FileDo } from './do';

interface LegacyFileResponse {
	_id: string;
	name: string;
	isDirectory: boolean;
	parent?: string;
	storageFileName?: string;
	bucket?: string;
	storageProviderId?: string;
}

@Injectable()
export class LegacyFileStorageAdapter {
	constructor(
		private readonly httpService: HttpService,
		@Inject(LEGACY_FILE_ARCHIVE_CONFIG_TOKEN) private readonly config: LegacyFileArchiveConfig
	) {}

	public getFilesForOwner(ownerId: EntityId, jwt: string): Promise<FileDo[]> {
		return this.fetchRecursively(ownerId, undefined, jwt);
	}

	private async fetchRecursively(ownerId: EntityId, parentId: string | undefined, jwt: string): Promise<FileDo[]> {
		const baseUrl = String(this.config.legacyBaseUrl);
		const params: Record<string, string> = { owner: ownerId };
		if (parentId !== undefined) {
			params.parent = parentId;
		}

		const response = await firstValueFrom(
			this.httpService.get<LegacyFileResponse[]>(`${baseUrl}/fileStorage`, {
				params,
				headers: { authorization: `Bearer ${jwt}` },
			})
		);

		const rawFiles: LegacyFileResponse[] = Array.isArray(response.data) ? response.data : [];

		const mapped = rawFiles.map(
			(f) =>
				new FileDo({
					id: f._id,
					name: f.name,
					isDirectory: f.isDirectory,
					parentId: f.parent,
					storageFileName: f.storageFileName,
					bucket: f.bucket,
					storageProviderId: f.storageProviderId,
				})
		);

		const childFetches = rawFiles
			.filter((f) => f.isDirectory)
			.map((dir) => this.fetchRecursively(ownerId, dir._id, jwt));

		const children = (await Promise.all(childFetches)).flat();

		return [...mapped, ...children];
	}
}
