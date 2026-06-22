import { EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { FederalStateEntity } from './federal-state.entity';

@Injectable()
export class FederalStateRepo extends BaseRepo<FederalStateEntity> {
	get entityName(): EntityName<FederalStateEntity> {
		return FederalStateEntity;
	}

	public findByNameOrFail(name: string): Promise<FederalStateEntity> {
		return this._em.findOneOrFail(FederalStateEntity, { name });
	}

	public findByName(name: string): Promise<FederalStateEntity | null> {
		return this._em.findOne(FederalStateEntity, { name });
	}
}
