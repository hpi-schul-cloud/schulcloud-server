import { Embedded, Entity, Property, Unique } from '@mikro-orm/core';
import { ExternalToolConfig } from '@shared/domain/entity/external-tool/config/external-tool-config';
import { CustomParameter } from './custom-parameter/custom-parameter';
import { BaseEntityWithTimestamps } from '../base.entity';

export type IExternalToolProperties = Readonly<Omit<ExternalTool, keyof BaseEntityWithTimestamps>>;

@Entity({ tableName: 'external_tools' })
export class ExternalTool extends BaseEntityWithTimestamps {
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

	@Unique()
	@Property()
	name: string;

	@Property()
	url?: string;

	@Property()
	logoUrl?: string;

	@Embedded(() => ExternalToolConfig)
	config: ExternalToolConfig;

	@Embedded(() => CustomParameter, { array: true })
	parameters?: CustomParameter[];

	@Property()
	isHidden: boolean;

	@Property()
	openNewTab: boolean;

	@Property()
	version?: number;
}
