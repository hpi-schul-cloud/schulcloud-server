import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { School } from '@shared/domain';

@Injectable()
export class SchoolRepo extends BaseRepo<School> {
	get entityName() {
		return School;
	}

	async findByExternalIdOrFail(externalId: string, systemId: string): Promise<School> {
		const school: School = await this._em.findOneOrFail(School, { externalId, systems: systemId });

		return school;
	}
}
