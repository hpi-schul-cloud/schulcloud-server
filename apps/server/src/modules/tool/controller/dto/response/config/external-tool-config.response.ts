import { ToolConfigType } from '../../../../interface';

export abstract class ExternalToolConfigResponse {
	abstract type: ToolConfigType;

	abstract baseUrl: string;
}
