import { Injectable } from '@nestjs/common';
import { SchoolYearEntity } from '@shared/domain';
import { BaseRepo } from '@shared/repo/base.repo';

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
}
