import { Builder } from 'xml2js';
import { CommonCartridgeResourceType, CommonCartridgeVersion } from './common-cartridge-enums';
import { CommonCartridgeLtiResource, ICommonCartridgeLtiResourceProps } from './common-cartridge-lti-resource';

describe('CommonCartridgeLtiResource', () => {
	const propsVersion1: ICommonCartridgeLtiResourceProps = {
		type: CommonCartridgeResourceType.LTI,
		version: CommonCartridgeVersion.V_1_1_0,
		identifier: 'lti-identifier-version1',
		href: 'lti-identifier-version1/lti.xml',
		title: 'lti-title-version1',
		description: 'lti-description-version1',
		url: 'https://to-a-lti-tool-version1.tld',
	};

	const propsVersion3: ICommonCartridgeLtiResourceProps = {
		type: CommonCartridgeResourceType.LTI,
		version: CommonCartridgeVersion.V_1_3_0,
		identifier: 'lti-identifier-version3',
		href: 'lti-identifier-version3/lti.xml',
		title: 'lti-title-version3',
		description: 'lti-description-version3',
		url: 'https://to-a-lti-tool-version3.tld',
	};

	const ltiResourceVersion1 = new CommonCartridgeLtiResource(propsVersion1, new Builder());
	const ltiResourceVersion3 = new CommonCartridgeLtiResource(propsVersion3, new Builder());

	describe('content', () => {
		describe('When Common Cartridge version 1.1', () => {
			it('should return correct content for version 1.1', () => {
				const expectedContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
										<cartridge_basiclti_link 
											xmlns="/xsd/imslticc_v1p0" 
											xmlns:blti="/xsd/imsbasiclti_v1p0" 
											xmlns:lticm="/xsd/imslticm_v1p0" 
											xmlns:lticp="/xsd/imslticp_v1p0" 
											xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
											xsi:schemaLocation="/xsd/imslticc_v1p0 
																/xsd/lti/ltiv1p0/imslticc_v1p0.xsd/xsd/imsbasiclti_v1p0 
																/xsd/lti/ltiv1p0/imsbasiclti_v1p0.xsd/xsd/imslticm_v1p0 
																/xsd/lti/ltiv1p0/imslticm_v1p0.xsd/xsd/imslticp_v1p0 
																/xsd/lti/ltiv1p0/imslticp_v1p0.xsd&quot;">
											<blti>
												<title>lti-title-version1</title>
												<description>lti-description-version1</description>
												<launch_url>https://to-a-lti-tool-version1.tld</launch_url>
												<secure_launch_url>https://to-a-lti-tool-version1.tld</secure_launch_url>
												<cartridge_bundle identifierref="BLTI001_Bundle"/>
												<cartridge_icon identifierref="BLTI001_Icon"/>
											</blti>
										</cartridge_basiclti_link>`;

				const content = ltiResourceVersion1.content();

				expect(content.replace(/\s/g, '')).toEqual(expectedContent.replace(/\s/g, ''));
			});
		});

		describe('When Common Cartridge version 1.3', () => {
			it('should return correct content for version 1.3', () => {
				const expectedContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
										<cartridge_basiclti_link 
											xmlns="http://www.imsglobal.org/xsd/imslticc_v1p3" 
											xmlns:blti="http://www.imsglobal.org/xsd/imsbasiclti_v1p0" 
											xmlns:lticm="http://www.imsglobal.org/xsd/imslticm_v1p0"
											xmlns:lticp="http://www.imsglobal.org/xsd/imslticp_v1p0"
											xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 											
											xsi:schemaLocation="http://www.imsglobal.org/xsd/imslticc_v1p3
														http://www.imsglobal.org/xsd/imslticc_v1p3.xsd
														http://www.imsglobal.org/xsd/imslticp_v1p0imslticp_v1p0.xsd
														http://www.imsglobal.org/xsd/imslticm_v1p0imslticm_v1p0.xsd
														http://www.imsglobal.org/xsd/imsbasiclti_v1p0imsbasiclti_v1p0p1.xsd&quot;">
											<blti>
												<title>lti-title-version3</title>
												<description>lti-description-version3</description>
												<launch_url>https://to-a-lti-tool-version3.tld</launch_url>
												<secure_launch_url>https://to-a-lti-tool-version3.tld</secure_launch_url>
												<cartridge_bundle identifierref="BLTI001_Bundle"/>
												<cartridge_icon identifierref="BLTI001_Icon"/>
											</blti>
										</cartridge_basiclti_link>`;

				const content = ltiResourceVersion3.content();

				expect(content.replace(/\s/g, '')).toEqual(expectedContent.replace(/\s/g, ''));
			});
		});
	});

	describe('transform', () => {
		describe('When Common Cartridge version 1.1', () => {
			it('should transform props into the expected resource structure', () => {
				const expectedOutput = {
					$: {
						identifier: propsVersion1.identifier,
						type: propsVersion1.type,
					},
					file: {
						$: {
							href: propsVersion1.href,
						},
					},
				};

				const transformed = ltiResourceVersion1.transform();
				expect(transformed).toEqual(expectedOutput);
			});
		});
		describe('When Common Cartridge version 1.3', () => {
			it('should transform props into the expected resource structure', () => {
				const expectedOutput = {
					$: {
						identifier: propsVersion3.identifier,
						type: propsVersion3.type,
					},
					file: {
						$: {
							href: propsVersion3.href,
						},
					},
				};

				const transformed = ltiResourceVersion3.transform();
				expect(transformed).toEqual(expectedOutput);
			});
		});
	});

	describe('canInline', () => {
		describe('When Common Cartridge version 1.1', () => {
			it('should return false for canInline', () => {
				const result = ltiResourceVersion1.canInline();
				expect(result).toBe(false);
			});
		});
		describe('When Common Cartridge version 1.3', () => {
			it('should return false for canInline', () => {
				const result = ltiResourceVersion3.canInline();
				expect(result).toBe(false);
			});
		});
	});
});
