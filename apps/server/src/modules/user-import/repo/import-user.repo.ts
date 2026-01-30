import { EntityName, FilterQuery, QueryOrderMap } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';

import { ObjectId } from '@mikro-orm/mongodb';
import { SchoolEntity } from '@modules/school/repo';
import { User } from '@modules/user/repo';
import { IFindOptions } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { ImportUserFilter } from '../domain/interface';
import { ImportUser } from '../entity';
import { ImportUserScope } from './import-user.scope';

@Injectable()
export class ImportUserRepo extends BaseRepo<ImportUser> {
	get entityName(): EntityName<ImportUser> {
		return ImportUser;
	}

	public async findById(id: EntityId): Promise<ImportUser> {
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
	public async hasMatch(user: User): Promise<ImportUser | null> {
		const scope = new ImportUserScope();
		scope.byUserMatch(user);
		const importUser = await this._em.findOne(ImportUser, scope.query);
		return importUser;
	}

	public async findImportUsers(
		school: SchoolEntity,
		filters?: ImportUserFilter,
		options?: IFindOptions<ImportUser>
	): Promise<Counted<ImportUser[]>> {
		const scope = new ImportUserScope();
		scope.bySchool(school);
		if (filters) {
			if (filters.firstName) scope.byFirstName(filters.firstName);
			if (filters.lastName) scope.byLastName(filters.lastName);
			if (filters.loginName) scope.byLoginName(filters.loginName);
			if (filters.role) scope.byRole(filters.role);
			if (filters.classes) scope.byClasses(filters.classes);
			if (filters.matches) scope.byMatches(filters.matches);
			if (filters.flagged) scope.isFlagged(true);
		}

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
		await this._em.populate(userMatches, ['roles']);
		return [importUserEntities, count];
	}

	public async deleteImportUsersBySchool(school: SchoolEntity): Promise<void> {
		await this._em.nativeDelete(ImportUser, { school });
	}

	public async saveImportUsers(importUsers: ImportUser[]): Promise<void> {
		await this._em.persist(importUsers).flush();
	}
}
