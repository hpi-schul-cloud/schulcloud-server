import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeElement } from '../../interfaces';

export type CommonCartridgeResourcesWrapperElementPropsV110 = {
	type: CommonCartridgeElementType.RESOURCES_WRAPPER;
	version: CommonCartridgeVersion;
	items: CommonCartridgeElement[];
};

export class CommonCartridgeResourcesWrapperElementV110 extends CommonCartridgeElement {
	constructor(private readonly props: CommonCartridgeResourcesWrapperElementPropsV110) {
		super(props);
	}

	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_1_0;
	}

	public getManifestXmlObject(): Record<string, unknown> {
		return {
			resources: [
				{
					resource: this.props.items.map((items) => items.getManifestXmlObject()),
				},
			],
		};
	}
}
