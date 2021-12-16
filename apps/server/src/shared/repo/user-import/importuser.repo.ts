
import { FilterQuery } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { Counted, EntityId, IFindOptions, ImportUser } from '@shared/domain';


@Injectable()
export class ImportUserRepo extends BaseRepo<ImportUser> {
	async findById(id: EntityId): Promise<ImportUser> {
		const importUser = await this.em.findOneOrFail(ImportUser, { id });
		return importUser;
	}

	async findImportUsersAndCount(query: FilterQuery<ImportUser>, options?: IFindOptions<ImportUser>): Promise<Counted<ImportUser[]>> {
		const { pagination, order } = options || {};
		const [importUserEntities, count] = await this.em.findAndCount(ImportUser, query, {
			...pagination,
			orderBy: order,
		});

		// ToDo: populate values

		return [importUserEntities, count];
	}
}