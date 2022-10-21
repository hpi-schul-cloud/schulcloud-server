import AdmZip from 'adm-zip';
import { Builder } from 'xml2js';
import { CommonCartridgeResourceWrapperElement } from '@src/modules/learnroom/common-cartridge/common-cartridge-resource-wrapper-element';
import { CommonCartridgeOrganizationWrapperElement } from '@src/modules/learnroom/common-cartridge/common-cartridge-organization-wrapper-element';
import { CommonCartridgeMetadataElement } from './common-cartridge-metadata-element';
import {
	CommonCartridgeOrganizationItemElement,
	ICommonCartridgeOrganizationProps,
} from './common-cartridge-organization-item-element';
import {
	ICommonCartridgeResourceProps,
	CommonCartridgeResourceItemElement,
} from './common-cartridge-resource-item-element';

export type ICommonCartridgeFileBuilderOptions = {
	title: string;
};

/*
  This class builds a Common Cartridge file according to
  Common Cartridge 1.3.0 and supports only this format at the moment.
  For more information look here: https://www.imsglobal.org/cc/index.html
 */
export class CommonCartridgeFileBuilder {
	private options: ICommonCartridgeFileBuilderOptions;

	private readonly zipBuilder = new AdmZip();

	private readonly xmlBuilder = new Builder({
		rootName: 'manifest',
	});

	private metadata: CommonCartridgeMetadataElement;

	private organizations = [] as CommonCartridgeOrganizationItemElement[];

	private resources = [] as CommonCartridgeResourceItemElement[];

	constructor(options: ICommonCartridgeFileBuilderOptions) {
		this.options = options;
		this.metadata = new CommonCartridgeMetadataElement({
			title: options.title,
		});
	}

	get manifest(): string {
		return this.xmlBuilder.buildObject({
			$: {
				identifier: this.options.title,
				xmlns: 'http://www.imsglobal.org/xsd/imsccv1p3/imscp_v1p1',
				'xmlns:lommanifest': 'http://ltsc.ieee.org/xsd/imsccv1p3/LOM/manifest',
				'xmlns:lomresource': 'http://ltsc.ieee.org/xsd/imsccv1p3/LOM/resource',
				'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
				'xsi:schemaLocation':
					'http://ltsc.ieee.org/xsd/imsccv1p3/LOM/resource http://www.imsglobal.org/profile/cc/ccv1p3/LOM/ccv1p3_lomresource_v1p0.xsd http://www.imsglobal.org/xsd/imsccv1p3/imscp_v1p1 http://www.imsglobal.org/profile/cc/ccv1p3/ccv1p3_imscp_v1p2_v1p0.xsd http://ltsc.ieee.org/xsd/imsccv1p3/LOM/manifest http://www.imsglobal.org/profile/cc/ccv1p3/LOM/ccv1p3_lommanifest_v1p0.xsd',
			},
			metadata: this.metadata.transform(),
			organizations: new CommonCartridgeOrganizationWrapperElement(this.organizations).transform(),
			resources: new CommonCartridgeResourceWrapperElement(this.resources).transform(),
		});
	}

	async build(): Promise<Buffer> {
		this.zipBuilder.addFile('imsmanifest.xml', Buffer.from(this.manifest));
		return this.zipBuilder.toBufferPromise();
	}

	addOrganizationItems(
		props: ICommonCartridgeOrganizationProps | ICommonCartridgeOrganizationProps[]
	): CommonCartridgeFileBuilder {
		if (Array.isArray(props)) {
			props.map((prop) => this.organizations.push(new CommonCartridgeOrganizationItemElement(prop)));
		} else {
			this.organizations.push(new CommonCartridgeOrganizationItemElement(props));
		}
		return this;
	}

	addResourceItems(props: ICommonCartridgeResourceProps | ICommonCartridgeResourceProps[]): CommonCartridgeFileBuilder {
		if (Array.isArray(props)) {
			props.map((prop) => this.resources.push(new CommonCartridgeResourceItemElement(prop)));
		} else {
			this.resources.push(new CommonCartridgeResourceItemElement(props));
		}
		return this;
	}
}
