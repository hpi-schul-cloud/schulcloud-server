import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { MediaSource } from '../do';
import { MediaSourceDataFormat } from '../enum';
import { MediaSourceRepo } from '../repo';

@Injectable()
export class MediaSourceService {
	constructor(private readonly mediaSourceRepo: MediaSourceRepo) {}

	public async findBySourceId(id: EntityId): Promise<MediaSource | null> {
		const domainObject: MediaSource | null = await this.mediaSourceRepo.findBySourceId(id);

		return domainObject;
	}

	public async findByFormat(format: MediaSourceDataFormat): Promise<MediaSource | null> {
		const domainObject: MediaSource | null = await this.mediaSourceRepo.findByFormat(format);

		return domainObject;
	}

	public async findByFormatAndSourceId(format: MediaSourceDataFormat, sourceId: EntityId): Promise<MediaSource | null> {
		const domainObject: MediaSource | null = await this.mediaSourceRepo.findByFormatAndSourceId(format, sourceId);

		return domainObject;
	}

	public async saveAll(domainObject: MediaSource[]): Promise<MediaSource[]> {
		const savedObjects: MediaSource[] = await this.mediaSourceRepo.saveAll(domainObject);

		return savedObjects;
	}

	public async getAllMediaSources(): Promise<MediaSource[]> {
		const mediaSources: MediaSource[] = await this.mediaSourceRepo.findAll();

		return mediaSources;
	}
}
