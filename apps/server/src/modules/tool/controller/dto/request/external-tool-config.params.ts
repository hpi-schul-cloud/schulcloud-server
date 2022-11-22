import { ToolConfigType } from '@src/modules/tool/interface/tool-config-type.enum';

export abstract class ExternalToolConfigCreateParams {
	abstract type: ToolConfigType;

	abstract baseUrl: string;
}
