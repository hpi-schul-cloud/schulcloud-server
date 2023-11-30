import { CommonCartridgeResourceType, CommonCartridgeVersion } from '../common-cartridge.enums';
import { CommonCartridgeLtiResource, CommonCartridgeLtiResourceProps } from './common-cartridge-lti-resource';

describe('CommonCartridgeLtiResource', () => {
	const propsVersion1: CommonCartridgeLtiResourceProps = {
		type: CommonCartridgeResourceType.LTI,
		version: CommonCartridgeVersion.V_1_1_0,
		identifier: 'lti-identifier-version1',
		folder: 'lti-identifier-version1/lti.xml',
		title: 'lti-title-version1',
		description: 'lti-description-version1',
		url: 'https://to-a-lti-tool-version1.tld',
	};

	const propsVersion3: CommonCartridgeLtiResourceProps = {
		type: CommonCartridgeResourceType.LTI,
		version: CommonCartridgeVersion.V_1_3_0,
		identifier: 'lti-identifier-version3',
		folder: 'lti-identifier-version3/lti.xml',
		title: 'lti-title-version3',
		description: 'lti-description-version3',
		url: 'https://to-a-lti-tool-version3.tld',
	};

	const ltiResourceVersion1 = new CommonCartridgeLtiResource(propsVersion1);
	const ltiResourceVersion3 = new CommonCartridgeLtiResource(propsVersion3);

	describe('canInline', () => {
		describe('when the return value of the method is called', () => {
			it('should return false regardless of the common cartridge version', () => {
				const resultVersion1 = ltiResourceVersion1.canInline();
				const resultVersion3 = ltiResourceVersion3.canInline();

				expect(resultVersion1).toBe(false);
				expect(resultVersion3).toBe(false);
			});
		});
	});

	describe('getFilePath', () => {
		describe('when the return value of the method is called', () => {
			it('should return the file path regardless of the common cartridge version', () => {
				const filePathVersion1 = ltiResourceVersion1.getFilePath();
				const filePathVersion3 = ltiResourceVersion3.getFilePath();

				expect(filePathVersion1).toBe(`${propsVersion1.folder}/${propsVersion1.identifier}.xml`);
				expect(filePathVersion3).toBe(`${propsVersion3.folder}/${propsVersion3.identifier}.xml`);
			});
		});
	});

	describe('getFileContent', () => {
		describe('when Common Cartridge version 1.1', () => {
			it('should return correct XML content for version 1.1', () => {
				const content = ltiResourceVersion1.getFileContent();

				expect(content).toContain('cartridge_basiclti_link');
				expect(content).toContain('/xsd/imslticc_v1p0');
				expect(content).toContain('/xsd/imsbasiclti_v1p0');
				expect(content).toContain('/xsd/imslticm_v1p0');
				expect(content).toContain('/xsd/imslticp_v1p0');
				expect(content).toContain(
					'/xsd/imslticc_v1p0 /xsd/lti/ltiv1p0/imslticc_v1p0.xsd' +
						'/xsd/imsbasiclti_v1p0 /xsd/lti/ltiv1p0/imsbasiclti_v1p0.xsd' +
						'/xsd/imslticm_v1p0 /xsd/lti/ltiv1p0/imslticm_v1p0.xsd' +
						'/xsd/imslticp_v1p0 /xsd/lti/ltiv1p0/imslticp_v1p0.xsd'
				);
			});
		});

		describe('when Common Cartridge version 1.3', () => {
			it('should return correct XML content for version 1.3', () => {
				const content = ltiResourceVersion3.getFileContent();

				expect(content).toContain('cartridge_basiclti_link');
				expect(content).toContain('http://www.imsglobal.org/xsd/imslticc_v1p3');
				expect(content).toContain('http://www.imsglobal.org/xsd/imsbasiclti_v1p0');
				expect(content).toContain('http://www.imsglobal.org/xsd/imslticm_v1p0');
				expect(content).toContain('http://www.imsglobal.org/xsd/imslticp_v1p0');
				expect(content).toContain(
					'http://www.imsglobal.org/xsd/imslticc_v1p3 http://www.imsglobal.org/xsd/imslticc_v1p3.xsd' +
						'http://www.imsglobal.org/xsd/imslticp_v1p0 imslticp_v1p0.xsd' +
						'http://www.imsglobal.org/xsd/imslticm_v1p0 imslticm_v1p0.xsd' +
						'http://www.imsglobal.org/xsd/imsbasiclti_v1p0 imsbasiclti_v1p0p1.xsd'
				);
			});
		});

		describe('when version is not supported', () => {
			it('should throw an error', () => {
				const ltiResource = new CommonCartridgeLtiResource({
					...propsVersion1,
					version: 'xxx' as CommonCartridgeVersion,
				});

				expect(() => ltiResource.getFileContent()).toThrowError('Version xxx is not supported');
			});
		});
	});

	describe('getManifestXml', () => {
		describe('when the return value of the method is called', () => {
			it('should return manifest xml content regardless of the common cartridge version', () => {
				const transformedVersion1 = ltiResourceVersion1.getManifestXml();
				const transformedVersion3 = ltiResourceVersion3.getManifestXml();

				expect(transformedVersion1).toEqual({
					$: {
						identifier: propsVersion1.identifier,
						type: propsVersion1.type,
					},
					file: {
						$: {
							href: propsVersion1.folder,
						},
					},
				});

				expect(transformedVersion3).toEqual({
					$: {
						identifier: propsVersion3.identifier,
						type: propsVersion3.type,
					},
					file: {
						$: {
							href: propsVersion3.folder,
						},
					},
				});
			});
		});
	});
});
