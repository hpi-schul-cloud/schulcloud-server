import { EntityName } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { FederalStateEntity } from '@shared/domain/entity';
import { BaseRepo } from '../base.repo';

@Injectable()
export class FederalStateRepo extends BaseRepo<FederalStateEntity> {
	get entityName(): EntityName<FederalStateEntity> {
		return FederalStateEntity;
	}

	findByName(name: string): Promise<FederalStateEntity> {
		return this._em.findOneOrFail(FederalStateEntity, { name });
	}
}
