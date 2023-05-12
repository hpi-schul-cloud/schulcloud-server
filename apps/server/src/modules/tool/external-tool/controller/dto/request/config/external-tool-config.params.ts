import { ToolConfigType } from '@shared/domain';

export abstract class ExternalToolConfigCreateParams {
	abstract type: ToolConfigType;

	abstract baseUrl: string;
}
