import { LaunchRequestMethod, ToolLaunchDataType, ToolLaunchRequestDO } from '@shared/domain';
import { BaseFactory } from '../../base.factory';

export const toolLaunchRequestFactory = BaseFactory.define<ToolLaunchRequestDO, ToolLaunchRequestDO>(
	ToolLaunchRequestDO,
	() => {
		return {
			type: ToolLaunchDataType.BASIC,
			method: LaunchRequestMethod.GET,
			url: 'https://example.com/tool-launch',
			payload: '{ "key": "value" }',
			openNewTab: false,
		};
	}
);
