import { FilterQuery, QueryOrderMap } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { BaseRepo } from '@shared/repo/base.repo';
import { Counted, EntityId, IFindOptions, IImportUserScope, ImportUser, School, User } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { ImportUserScope } from './importuser.scope';

@Injectable()
export class ImportUserRepo extends BaseRepo<ImportUser> {
	get entityName() {
		return ImportUser;
	}

	async findById(id: EntityId): Promise<ImportUser> {
		if (!ObjectId.isValid(id)) throw new Error('invalid id');
		const importUser = await this._em.findOneOrFail(ImportUser, { id });
		if (importUser.user != null) {
			await this._em.populate(importUser.user, ['roles']);
		}
		return importUser;
	}

	/**
	 * resolves with importusers matched with a local user account
	 */
	async hasMatch(user: User): Promise<ImportUser | null> {
		const scope = new ImportUserScope();
		scope.byUserMatch(user);
		const importUser = await this._em.findOne(ImportUser, scope.query);
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
		const countedImportUsers = await this.findImportUsersAndCount(scope.query, options);
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
			orderBy: order as QueryOrderMap<ImportUser>,
		};
		const [importUserEntities, count] = await this._em.findAndCount(ImportUser, query, queryOptions);
		const userMatches = importUserEntities.map((importUser) => importUser.user).filter((user) => user != null);
		// load role names of referenced users
		await this._em.populate(userMatches as User[], ['roles']);
		return [importUserEntities, count];
	}

	async deleteImportUsersBySchool(school: School): Promise<void> {
		await this._em.nativeDelete(ImportUser, { school });
	}
}
