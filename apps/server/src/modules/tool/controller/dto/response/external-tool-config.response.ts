import { ToolConfigType } from '../../../interface/tool-config-type.enum';

export abstract class ExternalToolConfigResponse {
	abstract type: ToolConfigType;

	abstract baseUrl: string;
}
