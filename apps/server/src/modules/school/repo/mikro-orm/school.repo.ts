import { FindOptions } from '@mikro-orm/core';
import { AutoPath, EntityData, EntityName } from '@mikro-orm/core/typings';
import { Injectable } from '@nestjs/common';
import { FederalStateEntity, SchoolYearEntity } from '@shared/domain/entity';
import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { IFindOptions, SortOrder } from '@shared/domain/interface/find-options';
import { EntityId } from '@shared/domain/types/entity-id';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { School, SchoolProps, SchoolQuery, SchoolRepo } from '../../domain';
import { CountyEmbeddableMapper } from './mapper/county.embeddable.mapper';
import { SchoolEntityMapper } from './mapper/school.entity.mapper';
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

	public async getSchoolsBySystemIds(systemIds: EntityId[]): Promise<School[]> {
		const entities = await this.em.find(
			SchoolEntity,
			{ systems: { $in: systemIds } },
			{ populate: ['federalState', 'currentYear'] }
		);

		const schools = SchoolEntityMapper.mapToDos(entities);

		return schools;
	}

	mapDOToEntityProperties(domainObject: School): EntityData<SchoolEntity> {
		const props = domainObject.getProps();

		return {
			name: props.name,
			officialSchoolNumber: props.officialSchoolNumber,
			externalId: props.externalId,
			previousExternalId: props.previousExternalId,
			inMaintenanceSince: props.inMaintenanceSince,
			inUserMigration: props.inUserMigration,
			purpose: props.purpose,
			logo_dataUrl: props.logo_dataUrl,
			logo_name: props.logo_name,
			fileStorageType: props.fileStorageType,
			language: props.language,
			timezone: props.timezone,
			permissions: props.permissions,
			enableStudentTeamCreation: props.enableStudentTeamCreation,
			federalState: props.federalState ? this.em.getReference(FederalStateEntity, props.federalState?.id) : undefined,
			features: Array.from(props.features),
			currentYear: props.currentYear ? this.em.getReference(SchoolYearEntity, props.currentYear?.id) : undefined,
			county: props.county ? CountyEmbeddableMapper.mapToEntity(props.county) : undefined,
		};
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
