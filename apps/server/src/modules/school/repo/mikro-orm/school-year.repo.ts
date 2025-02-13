import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { SchoolYear, SchoolYearRepo } from '../../domain';
import { SchoolYearEntityMapper } from './mapper';
import { SchoolYearEntity } from './school-year.entity';

@Injectable()
export class SchoolYearMikroOrmRepo implements SchoolYearRepo {
	constructor(private readonly em: EntityManager) {}

	public async getAllSchoolYears(): Promise<SchoolYear[]> {
		const entities = await this.em.find(SchoolYearEntity, {});

		const dos = SchoolYearEntityMapper.mapToDos(entities);

		return dos;
	}
}
