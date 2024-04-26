import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeElement, CommonCartridgeResource, XmlObject } from '../../interfaces';
import { createIdentifier } from '../../utils';

export type CommonCartridgeOrganizationElementPropsV130 = {
	type: CommonCartridgeElementType.ORGANIZATION;
	version: CommonCartridgeVersion;
	identifier: string;
	title: string;
	items: CommonCartridgeResource | Array<CommonCartridgeElement | CommonCartridgeResource>;
};

export class CommonCartridgeOrganizationElementV130 extends CommonCartridgeElement {
	constructor(private readonly props: CommonCartridgeOrganizationElementPropsV130) {
		super(props);
	}

	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_3_0;
	}

	public getManifestXmlObject(): XmlObject {
		if (this.props.items instanceof CommonCartridgeResource) {
			return {
				$: {
					identifier: this.identifier,
					identifierref: this.props.items.identifier,
				},
				title: this.title,
			};
		}

		return {
			$: {
				identifier: this.identifier,
			},
			title: this.title,
			item: this.props.items.map((item) => {
				if (item instanceof CommonCartridgeResource) {
					return {
						$: {
							identifier: createIdentifier(),
							identifierref: item.identifier,
						},
						title: item.title,
					};
				}

				return item.getManifestXmlObject();
			}),
		};
	}
}
