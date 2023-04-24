import AdmZip from 'adm-zip';
import { Builder } from 'xml2js';
import { CommonCartridgeResourceWrapperElement } from './common-cartridge-resource-wrapper-element';
import { CommonCartridgeOrganizationWrapperElement } from './common-cartridge-organization-wrapper-element';
import { ICommonCartridgeAssignmentProps } from './common-cartridge-assignment-element';
import { CommonCartridgeAssignmentResourceItemElement } from './common-cartridge-assignment-resource-item-element';
import { ICommonCartridgeElement } from './common-cartridge-element.interface';
import { CommonCartridgeMetadataElement } from './common-cartridge-metadata-element';
import {
	CommonCartridgeOrganizationItemElement,
	ICommonCartridgeOrganizationProps,
} from './common-cartridge-organization-item-element';
import {
	ICommonCartridgeResourceProps,
	CommonCartridgeResourceItemElement,
} from './common-cartridge-resource-item-element';
import { ICommonCartridgeLessonContentProps } from './common-cartrigde-lesson-content-element';
import { CommonCartridgeLessonContentResourceItemElement } from './common-cartridge-lesson-content-ressource-item-element';

export type ICommonCartridgeFileBuilderOptions = {
	identifier: string;
	title: string;
};

/*
  This class builds a Common Cartridge file according to
  Common Cartridge 1.1.0 and supports only this format at the moment.
  For more information look here: https://www.imsglobal.org/cc/index.html
 */
export class CommonCartridgeFileBuilder {
	private options: ICommonCartridgeFileBuilderOptions;

	private readonly zipBuilder = new AdmZip();

	private readonly xmlBuilder = new Builder();

	private metadata: CommonCartridgeMetadataElement;

	private organizations = [] as ICommonCartridgeElement[];

	private resources = [] as ICommonCartridgeElement[];

	constructor(options: ICommonCartridgeFileBuilderOptions) {
		this.options = options;
		this.metadata = new CommonCartridgeMetadataElement({
			title: options.title,
		});
	}

	get manifest(): string {
		return this.xmlBuilder.buildObject({
			manifest: {
				$: {
					identifier: this.options.identifier,
					xmlns: 'http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1',
					'xmlns:mnf': 'http://ltsc.ieee.org/xsd/imsccv1p1/LOM/manifest',
					'xmlns:res': 'http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource',
					'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
					'xsi:schemaLocation':
						'http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource http://www.imsglobal.org/profile/cc/ccv1p1/LOM/ccv1p1_lomresource_v1p0.xsd ' +
						'http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1 http://www.imsglobal.org/profile/cc/ccv1p1/ccv1p1_imscp_v1p2_v1p0.xsd ' +
						'http://ltsc.ieee.org/xsd/imsccv1p1/LOM/manifest http://www.imsglobal.org/profile/cc/ccv1p1/LOM/ccv1p1_lommanifest_v1p0.xsd ',
				},
				metadata: this.metadata.transform(),
				organizations: new CommonCartridgeOrganizationWrapperElement(this.organizations).transform(),
				resources: new CommonCartridgeResourceWrapperElement(this.resources).transform(),
			},
		});
	}

	async build(): Promise<Buffer> {
		this.zipBuilder.addFile('imsmanifest.xml', Buffer.from(this.manifest));
		return this.zipBuilder.toBufferPromise();
	}

	addOrganizationItems(props: ICommonCartridgeOrganizationProps[]): CommonCartridgeFileBuilder {
		props.map((prop) => this.organizations.push(new CommonCartridgeOrganizationItemElement(prop)));
		return this;
	}

	addResourceItems(props: ICommonCartridgeResourceProps[]): CommonCartridgeFileBuilder {
		props.map((prop) => this.resources.push(new CommonCartridgeResourceItemElement(prop)));
		return this;
	}

	addAssignments(props: ICommonCartridgeAssignmentProps[]): CommonCartridgeFileBuilder {
		props.forEach((prop) => {
			const htmlPath = `${prop.identifier}/assignment.html`;
			this.zipBuilder.addFile(htmlPath, Buffer.from(`<h1>${prop.title}</h1>${prop.description}`));
			this.resources.push(
				new CommonCartridgeAssignmentResourceItemElement({
					identifier: prop.identifier,
					type: 'webcontent',
					href: htmlPath,
				})
			);
		});
		return this;
	}

	addLessonContents(props: ICommonCartridgeLessonContentProps[]): CommonCartridgeFileBuilder {
		props.forEach((prop) => {
			const htmlPath = `${prop.identifier}/lessonContent.html`;
			this.zipBuilder.addFile(htmlPath, Buffer.from(`<h1>${prop.title}</h1>${prop.content}`));
			this.resources.push(
				new CommonCartridgeLessonContentResourceItemElement({
					identifier: prop.identifier,
					type: 'webcontent',
					href: htmlPath,
				})
			);
		});
		return this;
	}
}
