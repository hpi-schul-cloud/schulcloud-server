import { ToolConfigType } from '../../../../interface';

export abstract class ExternalToolConfigCreateParams {
	abstract type: ToolConfigType;

	abstract baseUrl: string;
}
