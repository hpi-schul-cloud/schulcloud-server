import { Injectable } from '@nestjs/common';
import { SchoolYearEntity } from '@shared/domain/entity';
import { BaseRepo } from '@shared/repo/base.repo';
import { AdminApiSchoolCreateNoIdErrorLoggable } from '../loggable/admin-api-school-create-no-id-error.loggable';

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
			throw new AdminApiSchoolCreateNoIdErrorLoggable();
		}
		return years[0];
	}
}
