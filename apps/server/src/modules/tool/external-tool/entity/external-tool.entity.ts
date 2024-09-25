import { Embedded, Entity, Property, Unique } from '@mikro-orm/core';

import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { ToolContextType } from '../../common/enum';
import { BasicToolConfigEntity, Lti11ToolConfigEntity, Oauth2ToolConfigEntity } from './config';
import { CustomParameterEntity } from './custom-parameter';
import { ExternalToolMediumEntity } from './external-tool-medium.entity';
import { FileRecordRefEmbeddable } from './file-record-ref.embeddable';

export interface ExternalToolEntityProps {
	id?: EntityId;

	name: string;

	description?: string;

	url?: string;

	logoUrl?: string;

	logoBase64?: string;

	thumbnail?: FileRecordRefEmbeddable;

	config: BasicToolConfigEntity | Oauth2ToolConfigEntity | Lti11ToolConfigEntity;

	parameters?: CustomParameterEntity[];

	isHidden: boolean;

	isDeactivated: boolean;

	openNewTab: boolean;

	restrictToContexts?: ToolContextType[];

	medium?: ExternalToolMediumEntity;

	isPreferred: boolean;

	iconName?: string;
}

@Entity({ tableName: 'external-tools' })
export class ExternalToolEntity extends BaseEntityWithTimestamps {
	@Unique()
	@Property()
	name: string;

	@Property({ nullable: true })
	description?: string;

	@Property({ nullable: true })
	url?: string;

	@Property({ nullable: true })
	logoUrl?: string;

	@Property({ nullable: true })
	logoBase64?: string;

	@Embedded(() => FileRecordRefEmbeddable, { nullable: true, object: true })
	thumbnail?: FileRecordRefEmbeddable;

	@Embedded(() => [BasicToolConfigEntity, Oauth2ToolConfigEntity, Lti11ToolConfigEntity])
	config: BasicToolConfigEntity | Oauth2ToolConfigEntity | Lti11ToolConfigEntity;

	@Embedded(() => CustomParameterEntity, { array: true, nullable: true })
	parameters?: CustomParameterEntity[];

	@Property()
	isHidden: boolean;

	@Property()
	isDeactivated: boolean;

	@Property()
	openNewTab: boolean;

	@Property({ nullable: true })
	restrictToContexts?: ToolContextType[];

	@Embedded(() => ExternalToolMediumEntity, { nullable: true, object: true })
	medium?: ExternalToolMediumEntity;

	@Property()
	isPreferred: boolean;

	@Property({ nullable: true })
	iconName?: string;

	constructor(props: ExternalToolEntityProps) {
		super();
		if (props.id) {
			this.id = props.id;
		}
		this.name = props.name;
		this.description = props.description;
		this.url = props.url;
		this.logoUrl = props.logoUrl;
		this.logoBase64 = props.logoBase64;
		this.thumbnail = props.thumbnail;
		this.config = props.config;
		this.parameters = props.parameters;
		this.isHidden = props.isHidden;
		this.isDeactivated = props.isDeactivated;
		this.openNewTab = props.openNewTab;
		this.restrictToContexts = props.restrictToContexts;
		this.medium = props.medium;
		this.isPreferred = props.isPreferred;
		this.iconName = props.iconName;
	}
}
