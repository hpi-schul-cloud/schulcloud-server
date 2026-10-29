import { EntityName, QueryOrderMap } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { IFindOptions, SortOrder } from '@shared/domain/interface';
import { Counted } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { ReleaseEntity } from '../entity';

@Injectable()
export class ReleasesRepo extends BaseRepo<ReleaseEntity> {
	get entityName(): EntityName<ReleaseEntity> {
		return ReleaseEntity;
	}

	public async findReleases(options?: IFindOptions<ReleaseEntity>): Promise<Counted<ReleaseEntity[]>> {
		const { pagination, order } = options || {};
		const orderBy = { publishedAt: SortOrder.desc, ...order } as QueryOrderMap<ReleaseEntity>;

		const [releases, count] = await this._em.findAndCount(
			this.entityName,
			{},
			{
				offset: pagination?.skip,
				limit: pagination?.limit,
				orderBy,
			}
		);

		return [releases, count];
	}

	public async deleteAll(): Promise<void> {
		await this._em.nativeDelete(this.entityName, {});
	}
}
