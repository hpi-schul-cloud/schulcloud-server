import { Embedded, Entity, Property, Unique } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { BasicToolConfigEntity } from './config/basic-tool-config.entity';
import { Lti11ToolConfigEntity } from './config/lti11-tool-config.entity';
import { Oauth2ToolConfigEntity } from './config/oauth2-tool-config.entity';
import { CustomParameterEntity } from './custom-parameter/custom-parameter.entity';

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

	@Property({ nullable: true })
	logoBase64?: string;

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
		this.logoBase64 = props.logoBase64;
		this.config = props.config;
		this.parameters = props.parameters;
		this.isHidden = props.isHidden;
		this.openNewTab = props.openNewTab;
		this.version = props.version;
	}
}
