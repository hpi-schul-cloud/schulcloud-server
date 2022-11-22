import { ToolConfigType } from '@src/modules/tool/interface/tool-config-type.enum';

export abstract class ExternalToolConfigResponse {
	abstract type: ToolConfigType;

	abstract baseUrl: string;
}
