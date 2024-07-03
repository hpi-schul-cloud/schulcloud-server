import { Injectable } from '@nestjs/common';
import { SchoolYearEntity } from '@shared/domain/entity';
import { BaseRepo } from '@shared/repo/base.repo';
import { SchoolYearsNoYearsLeft } from '../loggable/schoolyear-no-years-left.loggable';

@Injectable()
export class SchoolYearRepo extends BaseRepo<SchoolYearEntity> {
	get entityName() {
		return SchoolYearEntity;
	}

	async findCurrentYear(): Promise<SchoolYearEntity> {
		const currentDate = new Date();
		const year: SchoolYearEntity | null = await this._em.findOneOrFail(SchoolYearEntity, {
			$and: [{ startDate: { $lte: currentDate } }, { endDate: { $gte: currentDate } }],
		});
		return year;
	}

	async findCurrentOrNextYear(): Promise<SchoolYearEntity> {
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
}
