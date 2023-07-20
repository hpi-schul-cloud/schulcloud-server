import { Embedded, Entity, Property, Unique } from '@mikro-orm/core';
import { BasicToolConfig, Lti11ToolConfig, Oauth2ToolConfig } from '@shared/domain/entity/tools/external-tool/config';
import { BaseEntityWithTimestamps } from '../../base.entity';
import { CustomParameter } from './custom-parameter';

export type IExternalToolProperties = Readonly<Omit<ExternalTool, keyof BaseEntityWithTimestamps>>;

@Entity({ tableName: 'external_tools' })
export class ExternalTool extends BaseEntityWithTimestamps {
	@Unique()
	@Property()
	name: string;

	@Property({ nullable: true })
	url?: string;

	@Property({ nullable: true })
	logoUrl?: string;

	@Embedded(() => [BasicToolConfig, Oauth2ToolConfig, Lti11ToolConfig])
	config: BasicToolConfig | Oauth2ToolConfig | Lti11ToolConfig;

	@Embedded(() => CustomParameter, { array: true, nullable: true })
	parameters?: CustomParameter[];

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
