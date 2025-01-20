import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { SchoolEntity } from '@shared/domain/entity';

@Injectable()
export class SchoolRepo {
	constructor(private readonly em: EntityManager) {}

	public async getSchoolById(schoolId: string) {
		const school = this.em.findOneOrFail(SchoolEntity, { id: schoolId });

		return school;
	}
}
