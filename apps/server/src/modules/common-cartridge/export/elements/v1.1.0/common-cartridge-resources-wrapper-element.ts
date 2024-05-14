import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeBase, CommonCartridgeElement, XmlObject } from '../../interfaces';

export type CommonCartridgeResourcesWrapperElementPropsV110 = {
	type: CommonCartridgeElementType.RESOURCES_WRAPPER;
	version: CommonCartridgeVersion;
	items: CommonCartridgeElement[];
};

export class CommonCartridgeResourcesWrapperElementV110 extends CommonCartridgeBase implements CommonCartridgeElement {
	constructor(private readonly props: CommonCartridgeResourcesWrapperElementPropsV110) {
		super(props);
	}

	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_1_0;
	}

	public getManifestXmlObject(): XmlObject {
		return {
			resources: [
				{
					resource: this.props.items.map((items) => items.getManifestXmlObject()),
				},
			],
		};
	}
}
