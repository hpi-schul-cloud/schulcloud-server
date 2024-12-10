import { Factory } from 'fishery';
import { LaunchRequestMethod, LaunchType, ToolLaunchRequest } from '../types';

export const toolLaunchRequestFactory = Factory.define<ToolLaunchRequest>(
	() =>
		new ToolLaunchRequest({
			url: 'https://example.com/tool-launch',
			method: LaunchRequestMethod.GET,
			payload: '{ "key": "value" }',
			openNewTab: false,
			launchType: LaunchType.BASIC,
		})
);
