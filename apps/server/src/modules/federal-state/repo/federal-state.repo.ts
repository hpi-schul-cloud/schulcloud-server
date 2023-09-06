import { Injectable } from '@nestjs/common';
import { FederalStateEntity } from '@shared/domain';
import { EntityManager } from '@mikro-orm/mongodb';

@Injectable()
export class FederalStateRepo {
	constructor(private readonly em: EntityManager) {}

	findByName(name: string): Promise<FederalStateEntity> {
		return this.em.findOneOrFail(FederalStateEntity, { name });
	}

	async findAll(): Promise<FederalStateEntity[]> {
		const federalStates: FederalStateEntity[] = await this.em.find(FederalStateEntity, {});
		return federalStates;
	}
}
