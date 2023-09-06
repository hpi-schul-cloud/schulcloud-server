import { Injectable } from '@nestjs/common';
import { FederalState } from '@shared/domain';
import { EntityName } from '@mikro-orm/core';
import { BaseRepo } from '@shared/repo';
// import { BaseRepo } from '../base.repo';

@Injectable()
export class FederalStateRepo extends BaseRepo<FederalState> {
	get entityName(): EntityName<FederalState> {
		return FederalState;
	}

	findByName(name: string): Promise<FederalState> {
		return this._em.findOneOrFail(FederalState, { name });
	}
}
