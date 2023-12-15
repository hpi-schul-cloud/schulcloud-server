import { CommonCartridgeResourceType, CommonCartridgeVersion } from '../../../common-cartridge/common-cartridge.enums';
import {
	CommonCartridgeResourceFactory,
	CommonCartridgeResourcePropsInternal,
} from '../../../common-cartridge/resources/common-cartridge-resource-factory';
import { CommonCartridgeMetadataElement } from '../elements/common-cartridge-metadata-element';
import { CommonCartridgeOrganizationElement } from '../elements/common-cartridge-organization-element';
import {
	CommonCartridgeManifestElementProps,
	CommonCartridgeManifestResource,
} from './common-cartridge-manifest-resource';

describe('CommonCartridgeManifestResource', () => {
	const metadataElementPropsVersion1 = {
		version: CommonCartridgeVersion.V_1_1_0,
		title: 'Manifest v1',
		creationDate: new Date(),
		copyrightOwners: ['Owner1Version1', 'Owner2Version2'],
	};

	const organizationElementPropsVersion1 = {
		identifier: 'organization-v1',
		title: 'Organization v1',
		items: [],
	};

	const webcontentResourcePropsVersion1: CommonCartridgeResourcePropsInternal = {
		type: CommonCartridgeResourceType.WEB_CONTENT,
		identifier: 'webcontent-v1',
		title: 'Webcontent Version 1',
		html: '<h1>Webcontent v1</h1>',
	};

	const webcontentResourceVersion1 = CommonCartridgeResourceFactory.create({
		...webcontentResourcePropsVersion1,
		version: CommonCartridgeVersion.V_1_1_0,
		folder: 'webcontent',
	});

	const propsOfVersion1: CommonCartridgeManifestElementProps = {
		version: CommonCartridgeVersion.V_1_1_0,
		identifier: 'manifest-v1',
		metadata: new CommonCartridgeMetadataElement(metadataElementPropsVersion1),
		organizations: [new CommonCartridgeOrganizationElement(organizationElementPropsVersion1)],
		resources: [webcontentResourceVersion1],
	};

	const metadataElementPropsVersion3 = {
		version: CommonCartridgeVersion.V_1_3_0,
		title: 'Manifest v3',
		creationDate: new Date(),
		copyrightOwners: ['Owner1Version3', 'Owner2Version3'],
	};

	const organizationElementPropsVersion3 = {
		identifier: 'organization-v3',
		title: 'Organization v3',
		items: [],
	};

	const webcontentResourcePropsVersion3: CommonCartridgeResourcePropsInternal = {
		type: CommonCartridgeResourceType.WEB_CONTENT,
		identifier: 'webcontent-v3',
		title: 'Webcontent Version 3',
		html: '<h1>Webcontent v3</h1>',
	};

	const webcontentResourceVersion3 = CommonCartridgeResourceFactory.create({
		...webcontentResourcePropsVersion3,
		version: CommonCartridgeVersion.V_1_3_0,
		folder: 'webcontent',
	});

	const propsOfVersion3: CommonCartridgeManifestElementProps = {
		version: CommonCartridgeVersion.V_1_3_0,
		identifier: 'manifest-v3',
		metadata: new CommonCartridgeMetadataElement(metadataElementPropsVersion3),
		organizations: [new CommonCartridgeOrganizationElement(organizationElementPropsVersion3)],
		resources: [webcontentResourceVersion3],
	};

	const manifestResourceV1 = new CommonCartridgeManifestResource(propsOfVersion1);
	const manifestResourceV3 = new CommonCartridgeManifestResource(propsOfVersion3);

	describe('canInline', () => {
		// AI next 28 lines
		describe('when common cartridge version 1.1', () => {
			it('should return false', () => {
				expect(manifestResourceV1.canInline()).toBe(false);
			});
		});

		describe('when common cartridge version 1.3', () => {
			it('should return false', () => {
				expect(manifestResourceV3.canInline()).toBe(false);
			});
		});
	});

	describe('getFilePath', () => {
		describe('when common cartridge version 1.1', () => {
			it('should return the file path regarding version 1.1', () => {
				const filePathV1 = manifestResourceV1.getFilePath();
				expect(filePathV1).toBe('imsmanifest.xml');
			});
		});

		describe('when common cartridge version 1.3', () => {
			it('should return the file path regarding version 1.3', () => {
				const filePathV3 = manifestResourceV3.getFilePath();
				expect(filePathV3).toBe('imsmanifest.xml');
			});
		});
	});

	describe('getFileContent', () => {
		describe('when common cartridge version 1.1', () => {
			it('should return the file content regarding version 1.1', () => {
				const fileContentV1 = manifestResourceV1.getFileContent();
				expect(fileContentV1).toContain('manifest');
				expect(fileContentV1).toContain('metadata');
				expect(fileContentV1).toContain('organizations');
				expect(fileContentV1).toContain('resources');
			});
		});

		describe('when common cartridge version 1.3', () => {
			it('should return the file content regarding version 1.3', () => {
				const fileContentV3 = manifestResourceV3.getFileContent();
				expect(fileContentV3).toContain('manifest');
				expect(fileContentV3).toContain('metadata');
				expect(fileContentV3).toContain('organizations');
				expect(fileContentV3).toContain('resources');
			});
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when common cartridge version 1.1', () => {
			it('should return the manifest XML object regarding version 1.1', () => {
				const transformedV1 = manifestResourceV1.getManifestXmlObject();

				expect(transformedV1).toContain('manifest');

				expect(transformedV1).toStrictEqual({
					manifest: {
						$: {
							identifier: 'manifest-v1',
							xmlns: 'http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1',
							'xmlns:mnf': 'http://ltsc.ieee.org/xsd/imsccv1p1/LOM/manifest',
							'xmlns:res': 'http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource',
							'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
							'xsi:schemaLocation':
								'http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource http://www.imsglobal.org/profile/cc/ccv1p1/LOM/ccv1p1_lomresource_v1p0.xsd ' +
								'http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1 http://www.imsglobal.org/profile/cc/ccv1p1/ccv1p1_imscp_v1p2_v1p0.xsd ' +
								'http://ltsc.ieee.org/xsd/imsccv1p1/LOM/manifest http://www.imsglobal.org/profile/cc/ccv1p1/LOM/ccv1p1_lommanifest_v1p0.xsd ',
						},
						metadata: {},
						organizations: {},
						resources: {},
					},
				});
			});
		});

		describe('when common cartridge version 1.3', () => {
			it('should return the manifest XML object regarding version 1.3', () => {
				const transformedV3 = manifestResourceV3.getManifestXmlObject();
			});
		});
	});
});
