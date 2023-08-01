import { ToolConfigType } from '../../../../../common/interface';

export abstract class ExternalToolConfigResponse {
	abstract type: ToolConfigType;

	abstract baseUrl: string;
}
