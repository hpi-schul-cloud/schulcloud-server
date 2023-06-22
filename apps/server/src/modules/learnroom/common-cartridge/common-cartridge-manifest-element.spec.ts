import { ICommonCartridgeElement } from './common-cartridge-element.interface';
import { CommonCartridgeManifestElement } from './common-cartridge-manifest-element';
import { CommonCartridgeVersion } from './common-cartridge-enums';
import { ICommonCartridgeMetadataProps } from './common-cartridge-metadata-element';

describe('CommonCartridgeManifestElement', () => {
	it('should transform the manifest based on the provided common cartridge version 3', () => {
		const props = {
			identifier: 'manifest-1',
		};

		const metadataProps: ICommonCartridgeMetadataProps = {
			version: CommonCartridgeVersion.V_1_3_0,
			title: 'title of test metadata',
			copyrightOwners: 'test copy right',
			creationYear: 'test year',
		};

		const metadataMock: ICommonCartridgeElement = {
			transform: jest.fn().mockReturnValue({
				schema: 'IMS Common Cartridge',
				schemaversion: metadataProps.version,
				'mnf:lom': {
					'mnf:general': {
						'mnf:title': {
							'mnf:string': metadataProps.title,
						},
					},
					'mnf:rights': {
						'mnf:copyrightAndOtherRestrictions': {
							'mnf:value': 'yes',
						},
						'mnf:description': {
							'mnf:string': `${metadataProps.creationYear} ${metadataProps.copyrightOwners}`,
						},
					},
				},
			}),
		};

		const organizationsMock: ICommonCartridgeElement[] = [
			{
				transform: jest.fn().mockReturnValue({
					organization: [
						{
							$: {
								identifier: 'organization-1',
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
				}),
			},
			{
				transform: jest.fn().mockReturnValue({ identifier: 'organization-2' }),
			},
		];

		const resourcesMock: ICommonCartridgeElement[] = [
			{
				transform: jest.fn().mockReturnValue({ identifier: 'resource-1' }),
			},
			{
				transform: jest.fn().mockReturnValue({ identifier: 'resource-2' }),
			},
		];

		const manifestElement = new CommonCartridgeManifestElement(props, metadataProps, organizationsMock, resourcesMock);
		const result = manifestElement.transform();
		const expectedResult = {
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
		};
		// expect(result.replace(/\s/g, '')).toEqual(expectedResult.replace(/\s/g, ''));

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
				metadata: {},
				organizations: organizationsMock,
				resources: [{ identifier: 'resource-1' }, { identifier: 'resource-2' }],
			},
		});

		expect(metadataMock.transform).toHaveBeenCalled();
		expect(organizationsMock[0].transform).toHaveBeenCalled();
		expect(organizationsMock[1].transform).toHaveBeenCalled();

		expect(resourcesMock[0].transform).toHaveBeenCalled();
		expect(resourcesMock[1].transform).toHaveBeenCalled();
	});
});
