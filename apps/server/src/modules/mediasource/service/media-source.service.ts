import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { MediaSource } from '../domain';
import { MediaSourceRepo } from '../repo';

@Injectable()
export class MediaSourceService {
	constructor(private readonly mediaSourceRepo: MediaSourceRepo) {}

	public async findBySourceId(id: EntityId): Promise<MediaSource | null> {
		const domainObject: MediaSource | null = await this.mediaSourceRepo.findBySourceId(id);

		return domainObject;
	}

	public async save(domainObject: MediaSource): Promise<MediaSource> {
		const savedObject: MediaSource = await this.mediaSourceRepo.save(domainObject);

		return savedObject;
	}
}
