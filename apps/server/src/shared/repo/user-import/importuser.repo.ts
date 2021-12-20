import { FilterQuery } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { Counted, EntityId, IFindOptions, IImportUserScope, ImportUser } from '@shared/domain';
import { ImportUserScope } from './importuser.scope';

@Injectable()
export class ImportUserRepo extends BaseRepo<ImportUser> {
	async findById(id: EntityId): Promise<ImportUser> {
		const importUser = await this.em.findOneOrFail(ImportUser, { id });
		return importUser;
	}

	async findImportUsers(filters: IImportUserScope, options?: IFindOptions<ImportUser>): Promise<Counted<ImportUser[]>> {
		const scope = new ImportUserScope();
		if (filters.firstName) scope.byFirstName(filters.firstName);
		if (filters.lastName) scope.byLastName(filters.lastName);
		return this.findImportUsersAndCount(scope.query, options);
	}

	private async findImportUsersAndCount(
		query: FilterQuery<ImportUser>,
		options?: IFindOptions<ImportUser>
	): Promise<Counted<ImportUser[]>> {
		const { pagination, order } = options || {};
		const queryOptions = {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order as QueryOrderMap,
		};
		const [importUserEntities, count] = await this.em.findAndCount(ImportUser, query, queryOptions);

		// ToDo: populate values

		return [importUserEntities, count];
	}
}
