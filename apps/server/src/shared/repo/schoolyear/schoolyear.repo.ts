import { Injectable } from '@nestjs/common';
import { SchoolYear } from '@shared/domain';
import { BaseRepo } from '@shared/repo/base.repo';

@Injectable()
export class SchoolYearRepo extends BaseRepo<SchoolYear> {
	get entityName() {
		return SchoolYear;
	}
}
