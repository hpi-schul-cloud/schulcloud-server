import { faker } from '@faker-js/faker';
import { CommonCartridgeResourceType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeLtiResourcePropsV110, CommonCartridgeLtiResourceV110 } from './common-cartridge-lti-resource';

describe('CommonCartridgeLtiResourceV110', () => {
	const setup = () => {
		const props: CommonCartridgeLtiResourcePropsV110 = {
			type: CommonCartridgeResourceType.LTI,
			version: CommonCartridgeVersion.V_1_1_0,
			identifier: faker.string.uuid(),
			folder: faker.string.uuid(),
			title: faker.lorem.words(),
			description: faker.lorem.sentence(),
			url: faker.internet.url(),
		};
		const sut = new CommonCartridgeLtiResourceV110(props);

		return { sut, props };
	};

	describe('canInline', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			it('should return false', () => {
				const { sut } = setup();
				const result = sut.canInline();

				expect(result).toBe(false);
			});
		});
	});

	describe('getFilePath', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			it('should return the constructed file path', () => {
				const { sut, props } = setup();
				const result = sut.getFilePath();

				expect(result).toBe(`${props.folder}/${props.identifier}.xml`);
			});
		});
	});

	describe('getFileContent', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			it('should contain correct XML root element', () => {
				const { sut } = setup();
				const result = sut.getFileContent();

				expect(result).toContain('<cartridge_basiclti_link');
				expect(result).toContain('</cartridge_basiclti_link>');
			});

			it('should contain correct XML namespace', () => {
				const { sut } = setup();
				const result = sut.getFileContent();

				expect(result).toContain('xmlns="/xsd/imslticc_v1p0"');
				expect(result).toContain('xmlns:blti="/xsd/imsbasiclti_v1p0"');
				expect(result).toContain('xmlns:lticm="/xsd/imslticm_v1p0"');
				expect(result).toContain('xmlns:lticp="/xsd/imslticp_v1p0"');
			});

			it('should contain correct XML schema', () => {
				const { sut } = setup();
				const result = sut.getFileContent();

				expect(result).toContain(
					'xsi:schemaLocation="' +
						'/xsd/imslticc_v1p0 /xsd/lti/ltiv1p0/imslticc_v1p0.xsd ' +
						'/xsd/imsbasiclti_v1p0 /xsd/lti/ltiv1p0/imsbasiclti_v1p0.xsd ' +
						'/xsd/imslticm_v1p0 /xsd/lti/ltiv1p0/imslticm_v1p0.xsd ' +
						'/xsd/imslticp_v1p0 /xsd/lti/ltiv1p0/imslticp_v1p0.xsd"'
				);
			});

			it('should contain correct XML title', () => {
				const { sut, props } = setup();
				const result = sut.getFileContent();

				expect(result).toContain(`<title>${props.title}</title>`);
			});

			it('should contain correct XML description', () => {
				const { sut, props } = setup();
				const result = sut.getFileContent();

				expect(result).toContain(`<description>${props.description}</description>`);
			});

			it('should contain correct XML url', () => {
				const { sut, props } = setup();
				const result = sut.getFileContent();

				expect(result).toContain(`<launch_url>${props.url}</launch_url>`);
				expect(result).toContain(`<secure_launch_url>${props.url}</secure_launch_url>`);
			});
		});
	});

	// AI next 10 lines
	describe('getSupportedVersion', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			it('should return correct version', () => {
				const { sut } = setup();
				const result = sut.getSupportedVersion();

				expect(result).toBe(CommonCartridgeVersion.V_1_1_0);
			});
		});
	});

	describe('getManifestXml', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			it('should return manifest xml object', () => {
				const { sut, props } = setup();
				const result = sut.getManifestXmlObject();

				expect(result).toEqual({
					$: {
						identifier: props.identifier,
						type: props.type,
					},
					file: {
						$: {
							href: `${props.folder}/${props.identifier}.xml`,
						},
					},
				});
			});
		});
	});
});
