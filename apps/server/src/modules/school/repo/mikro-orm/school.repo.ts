import { EntityName, FindOptions } from '@mikro-orm/core';
import { EntityId, IFindOptions, SchoolEntity, SortOrder } from '@shared/domain';
import { BaseRepo } from '@shared/repo';
import { School, SchoolProps, SchoolQuery, SchoolRepo } from '../../domain';
import { SchoolMapper } from './mapper/school.mapper';
import { SchoolScope } from './scope/school.scope';

// TODO: How should the repo implentation be named? I'm undecided between "SchoolMongoRepo" and "SchoolMikroOrmRepo".
// On the one hand we could have another repo for MongoDB but with mongoose, on the other hand we could have another repo with MikroORM but for a SQL database.
// Both is rather theoretical though.
// Another possibility is of course "SchoolRepoImpl", but I think it's more in the sense of a clean architecture to be specific about the kind of repo.
export class SchoolMikroOrmRepo extends BaseRepo<SchoolEntity> implements SchoolRepo {
	get entityName(): EntityName<SchoolEntity> {
		return SchoolEntity;
	}

	public async getAllSchools(query: SchoolQuery, options?: IFindOptions<SchoolProps>): Promise<School[]> {
		const scope = new SchoolScope();
		scope.allowEmptyQuery(true);
		scope.byFederalState(query.federalStateId);

		const findOptions = this.mapToMikroOrmOptions(options);

		const entities = await this._em.find(SchoolEntity, scope.query, findOptions);

		const schools = SchoolMapper.mapToDos(entities);

		return schools;
	}

	public async getSchool(schoolId: EntityId): Promise<School> {
		const entity = await this._em.findOneOrFail(
			SchoolEntity,
			{ id: schoolId },
			{ populate: ['federalState', 'currentYear', 'systems'] }
		);

		const school = SchoolMapper.mapToDo(entity);

		return school;
	}

	// TODO: This should probably be a common mapper for all repos.
	private mapToMikroOrmOptions(options?: IFindOptions<SchoolProps>): FindOptions<SchoolEntity> {
		const findOptions: FindOptions<SchoolEntity> = {
			offset: options?.pagination?.skip,
			limit: options?.pagination?.limit,
			orderBy: options?.order,
		};

		// If no order is specified, a default order is applied here, because pagination can be messed up without order.
		if (!findOptions.orderBy) {
			findOptions.orderBy = {
				_id: SortOrder.asc,
			};
		}

		return findOptions;
	}
}
