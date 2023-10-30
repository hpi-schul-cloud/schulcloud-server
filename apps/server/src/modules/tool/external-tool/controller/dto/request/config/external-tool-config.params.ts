import { ToolConfigType } from '@src/modules/tool/common/enum/tool-config-type.enum';

export abstract class ExternalToolConfigCreateParams {
	abstract type: ToolConfigType;

	abstract baseUrl: string;
}
