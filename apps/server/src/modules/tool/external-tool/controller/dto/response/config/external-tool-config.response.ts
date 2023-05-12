import { ToolConfigType } from '@shared/domain';

export abstract class ExternalToolConfigResponse {
	abstract type: ToolConfigType;

	abstract baseUrl: string;
}
