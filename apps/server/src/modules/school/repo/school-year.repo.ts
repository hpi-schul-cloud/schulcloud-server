import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { SchoolYear } from '../domain';
import { SchoolYearRepo } from '../domain/interface';
import { SchoolYearsNoYearsLeft } from '../domain/loggable';
import { SchoolYearEntityMapper } from './mapper';
import { SchoolYearEntity } from './school-year.entity';

@Injectable()
export class SchoolYearMikroOrmRepo extends BaseRepo<SchoolYearEntity> implements SchoolYearRepo {
	get entityName(): typeof SchoolYearEntity {
		return SchoolYearEntity;
	}

	public async findCurrentYear(): Promise<SchoolYearEntity> {
		const currentDate = new Date();
		const year: SchoolYearEntity | null = (await this._em.findOneOrFail(SchoolYearEntity, {
			$and: [{ startDate: { $lte: currentDate } }, { endDate: { $gte: currentDate } }],
		})) as SchoolYearEntity;

		return year;
	}

	public async findCurrentOrNextYear(): Promise<SchoolYearEntity> {
		const currentDate = new Date();
		const years: SchoolYearEntity[] = await this._em.find(
			SchoolYearEntity,
			{ endDate: { $gte: currentDate } },
			{ orderBy: { endDate: 'ASC' } }
		);
		if (years.length < 1) {
			throw new SchoolYearsNoYearsLeft();
		}

		return years[0];
	}

	public async getAllSchoolYears(): Promise<SchoolYear[]> {
		const entities = await this._em.find(SchoolYearEntity, {});

		const dos = SchoolYearEntityMapper.mapToDos(entities);

		return dos;
	}
}
