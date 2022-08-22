import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { School } from '@shared/domain';

@Injectable()
export class SchoolRepo extends BaseRepo<School> {
	get entityName() {
		return School;
	}

	async findByExternalIdOrFail(externalId: string, systemId: string): Promise<School> {
		const [schools] = await this._em.findAndCount(School, { externalId });
		const resultSchool = schools.find((school) => {
			const { systems } = school;
			return systems && systems.getItems().find((system) => system.id === systemId);
		});
		return resultSchool ?? Promise.reject();
	}
}
