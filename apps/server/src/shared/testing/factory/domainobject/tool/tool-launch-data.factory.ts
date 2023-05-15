import { ToolLaunchDataDO, ToolLaunchDataType } from '@shared/domain';
import { BaseFactory } from '../../base.factory';

export const toolLaunchDataFactory = BaseFactory.define<ToolLaunchDataDO, ToolLaunchDataDO>(ToolLaunchDataDO, () => {
	return {
		type: ToolLaunchDataType.BASIC,
		baseUrl: 'https://www.basic-baseurl.com/',
		properties: [],
		openNewTab: false,
	};
});
