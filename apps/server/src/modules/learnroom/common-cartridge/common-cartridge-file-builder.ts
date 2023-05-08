import AdmZip from 'adm-zip';
import { Builder } from 'xml2js';
import { CommonCartridgeResourceWrapperElement } from './common-cartridge-resource-wrapper-element';
import { CommonCartridgeOrganizationWrapperElement } from './common-cartridge-organization-wrapper-element';
import { ICommonCartridgeAssignmentProps } from './common-cartridge-assignment-element';
import {
	ICommonCartridgeAssignmentResourceItemProps,
	CommonCartridgeAssignmentResourceItemElement,
} from './common-cartridge-assignment-resource-item-element';
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
import { ICommonCartridgeLessonContentProps } from './common-cartridge-lesson-content-element';

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

	/**
	 * This method creates organization xml-items in the exported xml file.
	 * @param organizations An array of ICommonCartridgeOrganizationProps objects that contain the organization properties.
	 * @returns The CommonCartridgeFileBuilder object.
	 */
	addOrganizationItems(organizations: ICommonCartridgeOrganizationProps[]): CommonCartridgeFileBuilder {
		organizations.forEach((organizationProps) => {
			this.organizations.push(new CommonCartridgeOrganizationItemElement(organizationProps));
			organizationProps.contents?.forEach((contentProps) => {
				const resourceProps = this.mapOrganizationAndContentPropsToResourceProps(organizationProps, contentProps);
				this.zipBuilder.addFile(
					resourceProps.href,
					Buffer.from(`<h1>${contentProps.title}</h1><p>${contentProps.content}</p>`)
				);
				this.resources.push(new CommonCartridgeResourceItemElement(resourceProps));
			});
		});
		return this;
	}

	/**
	 * This method creates resources xml-items in the exported xml file.
	 * @param resources - An Array of ICommonCartridgeResourceProps objects that contain the resource properties.
	 * @returns The CommonCartridgeFileBuilder object.
	 */
	addResourceItems(resources: ICommonCartridgeResourceProps[]): CommonCartridgeFileBuilder {
		resources.forEach((resourceProps) => this.resources.push(new CommonCartridgeResourceItemElement(resourceProps)));
		return this;
	}

	/**
	 * This method adds assignments xml-items in the exported xml file.
	 * @param assignments - An array of objects that contains the properties of each assignment.
	 * @returns The CommonCartridgeFileBuilder object.
	 */
	addAssignments(assignments: ICommonCartridgeAssignmentProps[]): CommonCartridgeFileBuilder {
		assignments.forEach((assignmentProps) => {
			const resourceProps = this.mapAssignmentPropsToResourceProps(assignmentProps);
			this.zipBuilder.addFile(
				resourceProps.href,
				Buffer.from(`<h1>${assignmentProps.title}</h1>${assignmentProps.description}`)
			);
			this.resources.push(new CommonCartridgeAssignmentResourceItemElement(resourceProps));
		});
		return this;
	}

	/**
	 * This private method maps ICommonCartridgeOrganizationProps and ICommonCartridgeLessonContentProps to ICommonCartridgeResourceProps.
	 * @param organizationProps - ICommonCartridgeOrganizationProps
	 * @param contentProps - ICommonCartridgeLessonContentProps
	 * @returns ICommonCartridgeResourceProps
	 */
	private mapOrganizationAndContentPropsToResourceProps(
		organizationProps: ICommonCartridgeOrganizationProps,
		contentProps: ICommonCartridgeLessonContentProps
	): ICommonCartridgeResourceProps {
		return {
			identifier: contentProps.identifier,
			type: 'webcontent',
			href: `${organizationProps.identifier}/${contentProps.identifier}_content.html`,
		};
	}

	/**
	 * This private method maps ICommonCartridgeAssignmentProps to ICommonCartridgeAssignmentResourceItemProps.
	 * @param assignmentProps - ICommonCartridgeAssignmentProps
	 * @returns ICommonCartridgeAssignmentResourceItemProps
	 */
	private mapAssignmentPropsToResourceProps(
		assignmentProps: ICommonCartridgeAssignmentProps
	): ICommonCartridgeAssignmentResourceItemProps {
		return {
			identifier: assignmentProps.identifier,
			type: 'webcontent',
			href: `${assignmentProps.identifier}/assignment.html`,
		};
	}
}
