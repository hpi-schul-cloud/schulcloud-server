import { ToolConfigType } from '@shared/domain/entity/external-tool/tool-config-type.enum';

export abstract class ExternalToolConfig {
	constructor(props: ExternalToolConfig) {
		this.type = props.type;
		this.baseUrl = props.baseUrl;
	}

	type: ToolConfigType;

	baseUrl: string;
}
