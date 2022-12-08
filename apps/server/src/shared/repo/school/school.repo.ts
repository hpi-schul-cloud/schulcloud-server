import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { School } from '@shared/domain';

@Injectable()
export class SchoolRepo extends BaseRepo<School> {
	get entityName() {
		return School;
	}

	async findByExternalId(externalId: string, systemId: string): Promise<School | null> {
		const school: School | null = await this._em.findOne(School, { externalId, systems: systemId });

		return school;
	}

	async findBySchoolNumber(officialSchoolNumber: string): Promise<School | null> {
		const school: School | null = await this._em.findOne(School, { officialSchoolNumber });

		return school;
	}
}
