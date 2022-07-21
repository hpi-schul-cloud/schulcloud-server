import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { School } from '@shared/domain';

@Injectable()
export class SchoolRepo extends BaseRepo<School> {
	get entityName() {
		return School;
	}
}
