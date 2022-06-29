import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { School } from '@shared/domain';

@Injectable()
export class SchoolRepo extends BaseRepo<School> {
	get entityName() {
		return School;
	}

	async createAndSave(entity: School): Promise<School> {
		const result = this._em.create(School, entity);
		await this._em.persistAndFlush(result);
		return result;
	}
}
