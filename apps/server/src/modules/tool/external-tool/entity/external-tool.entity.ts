import { Embedded, Entity, Property, Unique } from '@mikro-orm/core';

import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { CustomParameterEntity } from './custom-parameter';
import { BasicToolConfigEntity, Lti11ToolConfigEntity, Oauth2ToolConfigEntity } from './config';
import { ToolContextType } from '../../common/enum';
import { ExternalToolMediumEntity } from './external-tool-medium.entity';

export type IExternalToolProperties = Readonly<Omit<ExternalToolEntity, keyof BaseEntityWithTimestamps>>;

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

	@Property()
	version: number;

	@Property({ nullable: true })
	restrictToContexts?: ToolContextType[];

	@Property({ nullable: true })
	medium?: ExternalToolMediumEntity;

	constructor(props: IExternalToolProperties) {
		super();
		this.name = props.name;
		this.description = props.description;
		this.url = props.url;
		this.logoUrl = props.logoUrl;
		this.logoBase64 = props.logoBase64;
		this.config = props.config;
		this.parameters = props.parameters;
		this.isHidden = props.isHidden;
		this.isDeactivated = props.isDeactivated;
		this.openNewTab = props.openNewTab;
		this.version = props.version;
		this.restrictToContexts = props.restrictToContexts;
		this.medium = props.medium;
	}
}
