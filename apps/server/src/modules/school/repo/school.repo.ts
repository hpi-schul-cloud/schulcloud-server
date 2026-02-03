import { FindOptions } from '@mikro-orm/core';
import { EntityData, EntityName, Populate } from '@mikro-orm/core/typings';
import type { SystemEntity } from '@modules/system/repo';
import { Injectable } from '@nestjs/common';
import { IFindOptions, SortOrder } from '@shared/domain/interface/find-options';
import { EntityId } from '@shared/domain/types/entity-id';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { School, SchoolProps, SchoolPurpose, SchoolQuery, SchoolRepo } from '../domain';
import { SchoolEntityMapper } from './mapper';
import { SchoolEntity } from './school.entity';
import { SchoolScope } from './scope/school.scope';

@Injectable()
export class SchoolMikroOrmRepo extends BaseDomainObjectRepo<School, SchoolEntity> implements SchoolRepo {
	get entityName(): EntityName<SchoolEntity> {
		return SchoolEntity;
	}

	public async getSchools(query: SchoolQuery, options?: IFindOptions<SchoolProps>): Promise<School[]> {
		const scope = new SchoolScope();
		scope.allowEmptyQuery(true);
		scope.byFederalState(query.federalStateId);
		scope.byExternalId(query.externalId);
		scope.bySystemId(query.systemId);
		scope.byPurpose(query.purpose);

		const findOptions = this.mapToMikroOrmOptions(options, ['federalState', 'currentYear']);

		const entities = await this.em.find(SchoolEntity, scope.query, findOptions);

		const schools = SchoolEntityMapper.mapToDos(entities);

		return schools;
	}

	public async getSchoolList(
		options?: IFindOptions<SchoolProps>,
		federalStateId?: EntityId
	): Promise<{ schools: School[]; count: number }> {
		const scope = new SchoolScope();
		scope.allowEmptyQuery(true);
		scope.byFederalState(federalStateId);
		scope.addQuery({ purpose: { $nin: [SchoolPurpose.EXTERNAL_PERSON_SCHOOL, SchoolPurpose.TOMBSTONE] } });

		const findOptions = this.mapToMikroOrmOptions(options, ['federalState', 'currentYear']);

		const [entities, count] = await this.em.findAndCount(SchoolEntity, scope.query, findOptions);
		const schools = SchoolEntityMapper.mapToDos(entities);
		return { schools, count };
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

	public async getSchoolsByIds(schoolIds: EntityId[]): Promise<School[]> {
		const entities = await this.em.find(
			SchoolEntity,
			{ id: { $in: schoolIds } },
			{ populate: ['federalState', 'currentYear'] }
		);

		const schools = entities.map((entity) => SchoolEntityMapper.mapToDo(entity));

		return schools;
	}

	public async getSchoolByOfficialSchoolNumber(officialSchoolNumber: string): Promise<School | null> {
		const entity: SchoolEntity | null = await this.em.findOne(
			SchoolEntity,
			{ officialSchoolNumber },
			{ populate: ['federalState', 'currentYear'] }
		);

		if (!entity) {
			return null;
		}

		const school = SchoolEntityMapper.mapToDo(entity);

		return school;
	}

	public async getSchoolsBySystemIds(systemIds: EntityId[]): Promise<School[]> {
		const entities = await this.em.find(
			SchoolEntity,
			{ systems: { $in: systemIds } },
			{ populate: ['federalState', 'currentYear'] }
		);

		const schools = SchoolEntityMapper.mapToDos(entities);

		return schools;
	}

	public async getAllSchoolIds(): Promise<EntityId[]> {
		// Since we don't need any of the EntityManager's features here, we load the ids with a Mongo query to be more efficient.
		const objectIds = await this.em.getCollection(this.entityName).distinct('_id');
		const ids = objectIds.map((objectId) => objectId.toString());

		return ids;
	}

	public async hasLdapSystem(schoolId: EntityId): Promise<boolean> {
		const entity: SchoolEntity | null = await this.em.findOne(
			SchoolEntity,
			{ id: schoolId },
			{ populate: ['systems'] }
		);

		if (!entity) {
			return false;
		}

		const hasLdapSystem: boolean = entity.systems
			.getItems()
			.some((system: SystemEntity): boolean => system.type === 'ldap' && !!system.ldapConfig?.active);

		return hasLdapSystem;
	}

	protected mapDOToEntityProperties(domainObject: School): EntityData<SchoolEntity> {
		const entityProps = SchoolEntityMapper.mapToEntityProperties(domainObject, this.em);

		return entityProps;
	}

	private mapToMikroOrmOptions<P extends string = never>(
		options?: IFindOptions<SchoolProps>,
		populate?: Populate<SchoolEntity, P>
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
