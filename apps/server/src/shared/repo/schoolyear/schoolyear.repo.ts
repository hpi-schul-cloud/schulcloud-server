import { Injectable } from '@nestjs/common';
import { SchoolYear } from '@shared/domain';
import { BaseRepo } from '@shared/repo/base.repo';

@Injectable()
export class SchoolYearRepo extends BaseRepo<SchoolYear> {
	get entityName() {
		return SchoolYear;
	}

	async findCurrentYear(): Promise<SchoolYear> {
		const currentDate = new Date();
		const year: SchoolYear | null = await this._em.findOneOrFail(SchoolYear, {
			$and: [{ startDate: { $lte: currentDate } }, { endDate: { $gte: currentDate } }],
		});
		return year;
	}
}
