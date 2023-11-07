import { SchoolYearEntity } from '@shared/domain/entity/schoolyear.entity';
import { BaseRepo } from '@shared/repo/base.repo';
import { SchoolYear, SchoolYearRepo } from '../../domain';
import { SchoolYearEntityMapper } from './mapper';

export class SchoolYearMikroOrmRepo extends BaseRepo<SchoolYearEntity> implements SchoolYearRepo {
	get entityName() {
		return SchoolYearEntity;
	}

	public async getAllSchoolYears(): Promise<SchoolYear[]> {
		const entities = await this._em.find(SchoolYearEntity, {});

		const dos = SchoolYearEntityMapper.mapToDos(entities);

		return dos;
	}
}
