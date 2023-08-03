import { CommonCartridgeManifestElement } from './common-cartridge-manifest-element';
import { CommonCartridgeVersion } from './common-cartridge-enums';
import { ICommonCartridgeMetadataProps } from './common-cartridge-metadata-element';

describe('CommonCartridgeManifestElement', () => {
	const metadataPropsV3: ICommonCartridgeMetadataProps = {
		version: CommonCartridgeVersion.V_1_3_0,
		title: 'title of test metadata v3',
		copyrightOwners: 'test copy right',
		creationYear: 'test year',
	};

	const metadataPropsV1: ICommonCartridgeMetadataProps = {
		version: CommonCartridgeVersion.V_1_1_0,
		title: 'title of test metadata v1',
		copyrightOwners: 'test copy right',
		creationYear: 'test year',
	};

	const props = {
		identifier: 'manifest-1',
	};
	describe('commen cartridge version 3', () => {
		it('should transform the manifest based on the provided common cartridge version 3', () => {
			const manifestElement = new CommonCartridgeManifestElement(props, metadataPropsV3, [], []);
			const result = manifestElement.transform();

			expect(result).toEqual({
				manifest: {
					$: {
						identifier: 'manifest-1',
						xmlns: 'http://www.imsglobal.org/xsd/imsccv1p3/imscp_v1p1',
						'xmlns:mnf': 'http://ltsc.ieee.org/xsd/imsccv1p3/LOM/manifest',
						'xmlns:res': 'http://ltsc.ieee.org/xsd/imsccv1p3/LOM/resource',
						'xmlns:ext': 'http://www.imsglobal.org/xsd/imsccv1p3/imscp_extensionv1p2',
						'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
						'xsi:schemaLocation':
							'http://ltsc.ieee.org/xsd/imsccv1p3/LOM/resource http://www.imsglobal.org/profile/cc/ccv1p3/LOM/ccv1p3_lomresource_v1p0.xsd ' +
							'http://www.imsglobal.org/xsd/imsccv1p3/imscp_v1p1 http://www.imsglobal.org/profile/cc/ccv1p3/ccv1p3_imscp_v1p2_v1p0.xsd ' +
							'http://ltsc.ieee.org/xsd/imsccv1p3/LOM/manifest http://www.imsglobal.org/profile/cc/ccv1p3/LOM/ccv1p3_lommanifest_v1p0.xsd ' +
							'http://www.imsglobal.org/xsd/imsccv1p3/imscp_extensionv1p2 http://www.imsglobal.org/profile/cc/ccv1p3/ccv1p3_cpextensionv1p2_v1p0.xsd',
					},
					metadata: {
						schema: 'IMS Common Cartridge',
						schemaversion: metadataPropsV3.version,
						'mnf:lom': {
							'mnf:general': {
								'mnf:title': {
									'mnf:string': metadataPropsV3.title,
								},
							},
							'mnf:rights': {
								'mnf:copyrightAndOtherRestrictions': {
									'mnf:value': 'yes',
								},
								'mnf:description': {
									'mnf:string': `${metadataPropsV3.creationYear} ${metadataPropsV3.copyrightOwners}`,
								},
							},
						},
					},
					organizations: {
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
										item: [],
									},
								],
							},
						],
					},
					resources: {
						resource: [],
					},
				},
			});
		});
	});
	describe('commen cartridge version 1', () => {
		it('should transform the manifest based on the provided common cartridge version 1', () => {
			const manifestElement = new CommonCartridgeManifestElement(props, metadataPropsV1, [], []);
			const result = manifestElement.transform();

			expect(result).toEqual({
				manifest: {
					$: {
						identifier: 'manifest-1',
						xmlns: 'http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1',
						'xmlns:mnf': 'http://ltsc.ieee.org/xsd/imsccv1p1/LOM/manifest',
						'xmlns:res': 'http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource',
						'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
						'xsi:schemaLocation':
							'http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource http://www.imsglobal.org/profile/cc/ccv1p1/LOM/ccv1p1_lomresource_v1p0.xsd ' +
							'http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1 http://www.imsglobal.org/profile/cc/ccv1p1/ccv1p1_imscp_v1p2_v1p0.xsd ' +
							'http://ltsc.ieee.org/xsd/imsccv1p1/LOM/manifest http://www.imsglobal.org/profile/cc/ccv1p1/LOM/ccv1p1_lommanifest_v1p0.xsd ',
					},
					metadata: {
						schema: 'IMS Common Cartridge',
						schemaversion: metadataPropsV1.version,
						'mnf:lom': {
							'mnf:general': {
								'mnf:title': {
									'mnf:string': metadataPropsV1.title,
								},
							},
							'mnf:rights': {
								'mnf:copyrightAndOtherRestrictions': {
									'mnf:value': 'yes',
								},
								'mnf:description': {
									'mnf:string': `${metadataPropsV1.creationYear} ${metadataPropsV1.copyrightOwners}`,
								},
							},
						},
					},
					organizations: {
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
										item: [],
									},
								],
							},
						],
					},
					resources: {
						resource: [],
					},
				},
			});
		});
	});
});
