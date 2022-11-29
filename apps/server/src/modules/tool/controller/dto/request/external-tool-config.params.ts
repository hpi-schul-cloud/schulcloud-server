import { ToolConfigType } from '../../../interface/tool-config-type.enum';

export abstract class ExternalToolConfigCreateParams {
	abstract type: ToolConfigType;

	abstract baseUrl: string;
}
