import { PropertyDataDO } from './property-data.do';
import { ToolLaunchDataType } from './tool-launch-data-type';

export class ToolLaunchDataDO {
	baseUrl: string;

	type: ToolLaunchDataType;

	properties: PropertyDataDO[];

	constructor(props: ToolLaunchDataDO) {
		this.baseUrl = props.baseUrl;
		this.type = props.type;
		this.properties = props.properties ?? [];
	}
}
