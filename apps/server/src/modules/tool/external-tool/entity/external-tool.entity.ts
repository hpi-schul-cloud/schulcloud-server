import { Embedded, Entity, Property, Unique } from '@mikro-orm/core';

import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { CustomParameterEntity } from './custom-parameter';
import { BasicToolConfigEntity, Lti11ToolConfigEntity, Oauth2ToolConfigEntity } from './config';

export type IExternalToolProperties = Readonly<Omit<ExternalToolEntity, keyof BaseEntityWithTimestamps>>;

@Entity({ tableName: 'external_tools' })
export class ExternalToolEntity extends BaseEntityWithTimestamps {
	@Unique()
	@Property()
	name: string;

	@Property({ nullable: true })
	url?: string;

	@Property({ nullable: true })
	logoUrl?: string;

	@Embedded(() => [BasicToolConfigEntity, Oauth2ToolConfigEntity, Lti11ToolConfigEntity])
	config: BasicToolConfigEntity | Oauth2ToolConfigEntity | Lti11ToolConfigEntity;

	@Embedded(() => CustomParameterEntity, { array: true, nullable: true })
	parameters?: CustomParameterEntity[];

	@Property()
	isHidden: boolean;

	@Property()
	openNewTab: boolean;

	@Property()
	version: number;

	constructor(props: IExternalToolProperties) {
		super();
		this.name = props.name;
		this.url = props.url;
		this.logoUrl = props.logoUrl;
		this.config = props.config;
		this.parameters = props.parameters;
		this.isHidden = props.isHidden;
		this.openNewTab = props.openNewTab;
		this.version = props.version;
	}
}
