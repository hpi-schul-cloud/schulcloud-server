import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { School, System } from '@shared/domain';
import { NotFoundError } from '@mikro-orm/core';

@Injectable()
export class SchoolRepo extends BaseRepo<School> {
	get entityName() {
		return School;
	}

	async findByExternalIdOrFail(externalId: string, systemId: string): Promise<School> {
		const schools: School[] = await this._em.find(School, { externalId });
		const resultSchool: School | undefined = schools.find((school: School): boolean => {
			const { systems } = school;
			return systems && !!systems.getItems().find((system: System): boolean => system.id === systemId);
		});

		if (!resultSchool) {
			throw new NotFoundError(`School entity with externalId: ${externalId} and systemId: ${systemId} not found.`);
		}

		return resultSchool;
	}
}
