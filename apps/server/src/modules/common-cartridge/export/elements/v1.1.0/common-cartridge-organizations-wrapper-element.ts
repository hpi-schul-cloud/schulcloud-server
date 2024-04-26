import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeElement, XmlObject } from '../../interfaces';

export type CommonCartridgeOrganizationsWrapperElementPropsV110 = {
	type: CommonCartridgeElementType.ORGANIZATIONS_WRAPPER;
	version: CommonCartridgeVersion;
	items: CommonCartridgeElement[];
};

export class CommonCartridgeOrganizationsWrapperElementV110 extends CommonCartridgeElement {
	constructor(private readonly props: CommonCartridgeOrganizationsWrapperElementPropsV110) {
		super(props);
	}

	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_1_0;
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
