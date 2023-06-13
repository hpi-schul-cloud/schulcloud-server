import { Injectable } from '@nestjs/common';
import { EntityId, FederalState } from '@shared/domain';
import { BaseRepo } from '../base.repo';

@Injectable()
export class FederalStateRepo extends BaseRepo<FederalState> {
	get entityName() {
		return FederalState;
	}

	cacheExpiration = 60000;

	async findById(id: EntityId): Promise<FederalState> {
		const promise: Promise<FederalState> = this._em.findOneOrFail(
			FederalState,
			{ id },
			{ cache: this.cacheExpiration }
		);
		return promise;
	}

	async findByIds(ids: string[]): Promise<FederalState[]> {
		const promise: Promise<FederalState[]> = this._em.find(
			FederalState,
			{ id: { $in: ids } },
			{ cache: this.cacheExpiration }
		);
		return promise;
	}
}
