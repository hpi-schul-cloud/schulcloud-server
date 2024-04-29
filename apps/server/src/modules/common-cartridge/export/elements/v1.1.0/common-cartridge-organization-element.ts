import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeGuard } from '../../common-cartridge.guard';
import { CommonCartridgeElement, CommonCartridgeResource, XmlObject } from '../../interfaces';
import { createIdentifier } from '../../utils';

export type CommonCartridgeOrganizationElementPropsV110 = {
	type: CommonCartridgeElementType.ORGANIZATION;
	version: CommonCartridgeVersion;
	identifier: string;
	title: string;
	items: CommonCartridgeResource | Array<CommonCartridgeElement>;
};

export class CommonCartridgeOrganizationElementV110 extends CommonCartridgeElement {
	constructor(protected readonly props: CommonCartridgeOrganizationElementPropsV110) {
		super(props);
	}

	public getSupportedVersion(): CommonCartridgeVersion {
		return CommonCartridgeVersion.V_1_1_0;
	}

	public getManifestXmlObject(): XmlObject {
		const xmlObject = CommonCartridgeGuard.isResource(this.props.items)
			? this.getManifestXmlObjectForResource(this.props.items)
			: this.getManifestXmlObjectForResourceCollection(this.props.items);

		return xmlObject;
	}

	private getManifestXmlObjectForResource(item: CommonCartridgeResource): XmlObject {
		const xmlObject = {
			$: {
				identifier: this.identifier,
				identifierref: item.identifier,
			},
			title: this.title,
		};

		return xmlObject;
	}

	private getManifestXmlObjectForResourceCollection(
		items: (CommonCartridgeElement | CommonCartridgeResource)[]
	): XmlObject {
		const xmlObject = {
			$: {
				identifier: this.identifier,
			},
			title: this.title,
			item: items.map((item) => {
				if (CommonCartridgeGuard.isResource(item)) {
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

		return xmlObject;
	}
}
