import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeElement, XmlObject } from '../../interfaces';

export type CommonCartridgeOrganizationsWrapperElementPropsV130 = {
	type: CommonCartridgeElementType.ORGANIZATIONS_WRAPPER;
	version: CommonCartridgeVersion;
	items: CommonCartridgeElement[];
};

export class CommonCartridgeOrganizationsWrapperElementV130 extends CommonCartridgeElement {
	constructor(private readonly props: CommonCartridgeOrganizationsWrapperElementPropsV130) {
		super(props);
	}

	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_3_0;
	}

	public getManifestXmlObject(): XmlObject {
		return {
			organization: [
				{
					$: {
						identifier: 'org-1',
						structure: 'rooted-hierarchy',
					},
					item: [
						{
							$: {
								identifier: 'LearningModules',
							},
							item: this.props.items.map((items) => items.getManifestXmlObject()),
						},
					],
				},
			],
		};
	}
}
