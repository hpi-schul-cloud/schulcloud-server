import { ToolConfigType } from '../../../../../common/enum';

export abstract class ExternalToolConfigCreateParams {
	public abstract type: ToolConfigType;

	public abstract baseUrl: string;
}
