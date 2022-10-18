import { Injectable } from '@nestjs/common';
import { BaseDORepo, EntityProperties } from '@shared/repo/base.do.repo';
import { EntityName } from '@mikro-orm/core';
import { LtiToolDO } from '@shared/domain/domainobject/ltitool.do';
import {
	IFindOptions,
	ILtiToolProperties,
	IPagination,
	LtiPrivacyPermission,
	LtiTool,
	Page,
	SortOrder,
} from '@shared/domain';
import { LtiToolScope } from '@shared/repo/ltitool/lti-tool.scope';
import { EntityManager } from '@mikro-orm/mongodb';
import { Logger } from '@src/core/logger';
import { LtiToolSortingMapper } from '@shared/repo/ltitool/lti-tool-sorting.mapper';
import { QueryOrderMap } from '@mikro-orm/core/enums';

@Injectable()
export class LtiToolRepo extends BaseDORepo<LtiToolDO, LtiTool, ILtiToolProperties> {
	constructor(
		protected readonly _em: EntityManager,
		protected readonly logger: Logger,
		protected readonly sortingMapper: LtiToolSortingMapper
	) {
		super(_em, logger);
	}

	get entityName(): EntityName<LtiTool> {
		return LtiTool;
	}

	getConstructor(): { new (I): LtiTool } {
		return LtiTool;
	}

	// TODO test
	async find(query: Partial<LtiToolDO>, options?: IFindOptions<LtiToolDO>): Promise<Page<LtiToolDO>> {
		const pagination: IPagination = options?.pagination || {};
		const order: QueryOrderMap<LtiTool> = this.sortingMapper.mapDOSortOrderToQueryOrder(options?.order || {});
		const scope: LtiToolScope = new LtiToolScope()
			.allowEmptyQuery(true)
			.byName(query.name)
			.byHidden(query.isHidden)
			.byTemplate(query.isTemplate);

		if (order._id == null) {
			order._id = SortOrder.asc;
		}

		const [entities, total]: [LtiTool[], number] = await this._em.findAndCount(LtiTool, scope.query, {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order,
		});

		return { data: entities.map((entity) => this.mapEntityToDO(entity)), total };
	}

	async findByName(name: string): Promise<LtiToolDO> {
		const entity = await this._em.findOneOrFail(LtiTool, { name });

		return this.mapEntityToDO(entity);
	}

	async findByOauthClientId(oAuthClientId: string): Promise<LtiToolDO> {
		const entity = await this._em.findOneOrFail(LtiTool, { oAuthClientId });
		return this.mapEntityToDO(entity);
	}

	async findByClientIdAndIsLocal(oAuthClientId: string, isLocal: boolean): Promise<LtiToolDO> {
		const entity = await this._em.findOneOrFail(LtiTool, { oAuthClientId, isLocal });
		return this.mapEntityToDO(entity);
	}

	protected mapEntityToDO(entity: LtiTool): LtiToolDO {
		return new LtiToolDO({
			id: entity.id,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			name: entity.name,
			url: entity.url,
			key: entity.key,
			secret: entity.secret,
			logo_url: entity.logo_url,
			lti_message_type: entity.lti_message_type,
			lti_version: entity.lti_version,
			resource_link_id: entity.resource_link_id,
			roles: entity.roles || [],
			privacy_permission: entity.privacy_permission || LtiPrivacyPermission.ANONYMOUS,
			customs: entity.customs,
			isTemplate: entity.isTemplate,
			isLocal: entity.isLocal,
			originToolId: entity.originToolId,
			oAuthClientId: entity.oAuthClientId,
			friendlyUrl: entity.friendlyUrl,
			skipConsent: entity.skipConsent,
			openNewTab: entity.openNewTab,
			frontchannel_logout_uri: entity.frontchannel_logout_uri,
			isHidden: entity.isHidden,
		});
	}

	protected mapDOToEntity(entityDO: LtiToolDO): EntityProperties<ILtiToolProperties> {
		return {
			id: entityDO.id,
			name: entityDO.name,
			url: entityDO.url,
			key: entityDO.key,
			secret: entityDO.secret,
			logo_url: entityDO.logo_url,
			lti_message_type: entityDO.lti_message_type,
			lti_version: entityDO.lti_version,
			resource_link_id: entityDO.resource_link_id,
			roles: entityDO.roles,
			privacy_permission: entityDO.privacy_permission,
			customs: entityDO.customs,
			isTemplate: entityDO.isTemplate,
			isLocal: entityDO.isLocal,
			originToolId: entityDO.originToolId,
			oAuthClientId: entityDO.oAuthClientId,
			friendlyUrl: entityDO.friendlyUrl,
			skipConsent: entityDO.skipConsent,
			openNewTab: entityDO.openNewTab,
			frontchannel_logout_uri: entityDO.frontchannel_logout_uri,
			isHidden: entityDO.isHidden,
		};
	}
}
