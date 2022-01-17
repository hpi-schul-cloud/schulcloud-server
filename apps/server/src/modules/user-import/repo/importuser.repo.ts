import { FilterQuery } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { QueryOrderMap } from '@mikro-orm/core/enums';
import { BaseRepo } from '@shared/repo/base.repo';
import { Counted, EntityId, IFindOptions, IImportUserScope, ImportUser, School } from '@shared/domain';
import { ImportUserScope } from './importuser.scope';

@Injectable()
export class ImportUserRepo extends BaseRepo<ImportUser> {
	async findById(id: EntityId): Promise<ImportUser> {
		const importUser = await this.em.findOneOrFail(ImportUser, { id });
		return importUser;
	}

	async findImportUsers(
		school: School,
		filters: IImportUserScope = {},
		options?: IFindOptions<ImportUser>
	): Promise<Counted<ImportUser[]>> {
		const scope = new ImportUserScope();
		scope.bySchool(school);
		if (filters.firstName != null) scope.byFirstName(filters.firstName);
		if (filters.lastName != null) scope.byLastName(filters.lastName);
		if (filters.loginName != null) scope.byLoginName(filters.loginName);
		if (filters.role != null) scope.byRole(filters.role);
		if (filters.classes != null) scope.byClasses(filters.classes);
		if (filters.matches != null) scope.byMatches(filters.matches);
		if (filters.flagged === true) scope.isFlagged(true);
		const countedImportUsers = this.findImportUsersAndCount(scope.query, options);
		return countedImportUsers;
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

		return [importUserEntities, count];
	}
}
