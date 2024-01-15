import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeElement } from '../../interfaces/common-cartridge-element.interface';

export type CommonCartridgeResourcesWrapperElementPropsV130 = {
	type: CommonCartridgeElementType.RESOURCES_WRAPPER;
	version: CommonCartridgeVersion;
	items: CommonCartridgeElement[];
};

export class CommonCartridgeResourcesWrapperElementV130 extends CommonCartridgeElement {
	constructor(private readonly props: CommonCartridgeResourcesWrapperElementPropsV130) {
		super(props);
	}

	public override getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_3_0;
	}

	public override getManifestXmlObject(): Record<string, unknown> {
		return {
			resources: [
				{
					resource: this.props.items.map((items) => items.getManifestXmlObject()),
				},
			],
		};
	}
}
