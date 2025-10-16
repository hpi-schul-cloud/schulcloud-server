import { ToolConfigType } from '../../../../../common/enum';

export abstract class ExternalToolConfigResponse {
	public abstract type: ToolConfigType;

	public abstract baseUrl: string;
}
