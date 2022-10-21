import AdmZip from 'adm-zip';
import { Builder } from 'xml2js';
import { ImsccResourceWrapperElement } from '@src/modules/learnroom/imscc/imscc-resource-wrapper-element';
import { ImsccOrganizationWrapperElement } from '@src/modules/learnroom/imscc/imscc-organization-wrapper-element';
import { ImsccMetadataElement } from './imscc-metadata-element';
import { ImsccOrganizationItemElement, IImsccOrganizationProps } from './imscc-organization-item-element';
import { IImsccResourceProps, ImsccResourceItemElement } from './imscc-resource-item-element';

export type IImsccFileBuilderOptions = {
	title: string;
};

export class ImsccFileBuilder {
	private options: IImsccFileBuilderOptions;

	private readonly zipBuilder = new AdmZip();

	private readonly xmlBuilder = new Builder({
		rootName: 'manifest',
	});

	private metadata: ImsccMetadataElement;

	private organizations = [] as ImsccOrganizationItemElement[];

	private resources = [] as ImsccResourceItemElement[];

	constructor(options: IImsccFileBuilderOptions) {
		this.options = options;
		this.metadata = new ImsccMetadataElement({
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
			organizations: new ImsccOrganizationWrapperElement(this.organizations).transform(),
			resources: new ImsccResourceWrapperElement(this.resources).transform(),
		});
	}

	async build(): Promise<Buffer> {
		this.zipBuilder.addFile('imsmanifest.xml', Buffer.from(this.manifest));
		return this.zipBuilder.toBufferPromise();
	}

	addOrganizationItems(props: IImsccOrganizationProps | IImsccOrganizationProps[]): ImsccFileBuilder {
		if (Array.isArray(props)) {
			props.map((prop) => this.organizations.push(new ImsccOrganizationItemElement(prop)));
		} else {
			this.organizations.push(new ImsccOrganizationItemElement(props));
		}
		return this;
	}

	addResourceItems(props: IImsccResourceProps | IImsccResourceProps[]): ImsccFileBuilder {
		if (Array.isArray(props)) {
			props.map((prop) => this.resources.push(new ImsccResourceItemElement(prop)));
		} else {
			this.resources.push(new ImsccResourceItemElement(props));
		}
		return this;
	}
}
