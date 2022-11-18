import { Embedded, Entity, Property, Unique } from '@mikro-orm/core';
import { ExternalToolConfig } from './config/external-tool-config';
import { CustomParameter } from './custom-parameter/custom-parameter';
import { BaseEntityWithTimestamps } from '../../base.entity';

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

	@Embedded(() => ExternalToolConfig)
	config: ExternalToolConfig;

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
