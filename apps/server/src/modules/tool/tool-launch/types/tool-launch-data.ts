import { type PropertyData } from './property-data';
import { type ToolLaunchDataType } from './tool-launch-data-type';

export class ToolLaunchData {
	baseUrl: string;

	type: ToolLaunchDataType;

	properties: PropertyData[];

	openNewTab: boolean;

	constructor(props: ToolLaunchData) {
		this.baseUrl = props.baseUrl;
		this.type = props.type;
		this.properties = props.properties;
		this.openNewTab = props.openNewTab;
	}
}
