import { ToolConfigType } from '../../../../../common/enum';

export abstract class ExternalToolConfigResponse {
	abstract type: ToolConfigType;

	abstract baseUrl: string;
}
