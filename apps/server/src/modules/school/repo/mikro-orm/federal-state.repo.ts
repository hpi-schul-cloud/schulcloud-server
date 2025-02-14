import { EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { FederalStateEntity } from './federal-state.entity';

@Injectable()
export class FederalStateRepo extends BaseRepo<FederalStateEntity> {
	get entityName(): EntityName<FederalStateEntity> {
		return FederalStateEntity;
	}

	findByName(name: string): Promise<FederalStateEntity> {
		return this._em.findOneOrFail(FederalStateEntity, { name });
	}
}
