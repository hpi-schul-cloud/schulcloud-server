import { FindOptions } from '@mikro-orm/core';
import { AutoPath } from '@mikro-orm/core/typings';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { IFindOptions, SortOrder } from '@shared/domain/interface/find-options';
import { EntityId } from '@shared/domain/types/entity-id';
import { School, SchoolProps, SchoolQuery, SchoolRepo } from '../../domain';
import { SchoolEntityMapper } from './mapper/school.entity.mapper';
import { SchoolScope } from './scope/school.scope';

@Injectable()
export class SchoolMikroOrmRepo implements SchoolRepo {
	constructor(private readonly em: EntityManager) {}

	public async getSchools(query: SchoolQuery, options?: IFindOptions<SchoolProps>): Promise<School[]> {
		const scope = new SchoolScope();
		scope.allowEmptyQuery(true);
		scope.byFederalState(query.federalStateId);

		const findOptions = this.mapToMikroOrmOptions(options, ['federalState', 'currentYear']);

		const entities = await this.em.find(SchoolEntity, scope.query, findOptions);

		const schools = SchoolEntityMapper.mapToDos(entities);

		return schools;
	}

	public async getSchoolById(schoolId: EntityId): Promise<School> {
		const entity = await this.em.findOneOrFail(
			SchoolEntity,
			{ id: schoolId },
			{ populate: ['federalState', 'currentYear'] }
		);

		const school = SchoolEntityMapper.mapToDo(entity);

		return school;
	}

	public async getAllSchoolsWithActiveLdapSystems(): Promise<School[]> {
		const entities = await this.em.find(
			SchoolEntity,
			{ systems: { $ne: undefined } },
			{ populate: ['systems', 'federalState', 'currentYear'] }
		);
		const entitiesWithActiveLdapSystems = entities.filter((entity) => this.hasActiveLdapSystem(entity));

		const schools = SchoolEntityMapper.mapToDos(entitiesWithActiveLdapSystems);

		return schools;
	}

	private hasActiveLdapSystem(school: SchoolEntity): boolean {
		const result = school.systems.getItems().some((system) => system.type === 'ldap' && system.ldapConfig?.active);

		return result;
	}

	private mapToMikroOrmOptions<P extends string = never>(
		options?: IFindOptions<SchoolProps>,
		populate?: AutoPath<SchoolEntity, P>[]
	): FindOptions<SchoolEntity, P> {
		const findOptions: FindOptions<SchoolEntity, P> = {
			offset: options?.pagination?.skip,
			limit: options?.pagination?.limit,
			orderBy: options?.order,
			populate,
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
