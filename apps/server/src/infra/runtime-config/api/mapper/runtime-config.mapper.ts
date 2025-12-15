import { RuntimeConfigValue } from '../../domain/runtime-config-value.do';
import { RuntimeConfigListItemResponse } from '../dto/response/runtime-config-list-item.response';
import { RuntimeConfigListResponse } from '../dto/response/runtime-config-list.response';

export class RuntimeConfigMapper {
	public static mapToRuntimeConfigListItemResponse(config: RuntimeConfigValue): RuntimeConfigListItemResponse {
		return new RuntimeConfigListItemResponse({
			key: config.getKey(),
			type: config.getTypeAndValue().type,
			value: config.getTypeAndValue().value,
			description: config.getDescription(),
		});
	}

	public static mapToRuntimeConfigListResponse(configs: RuntimeConfigValue[]): RuntimeConfigListResponse {
		const mappedConfigs = configs.map((config) => this.mapToRuntimeConfigListItemResponse(config));
		return new RuntimeConfigListResponse({ data: mappedConfigs });
	}
}
