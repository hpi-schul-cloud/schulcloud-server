import { faker } from '@faker-js/faker';
import { CommonCartridgeResourceType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import {
	CommonCartridgeWebLinkResourcePropsV130,
	CommonCartridgeWebLinkResourceV130,
} from './common-cartridge-web-link-resource';

describe('CommonCartridgeWebLinkResourceV130', () => {
	const setup = () => {
		const props: CommonCartridgeWebLinkResourcePropsV130 = {
			type: CommonCartridgeResourceType.WEB_LINK,
			version: CommonCartridgeVersion.V_1_3_0,
			identifier: faker.string.uuid(),
			folder: faker.string.uuid(),
			title: faker.lorem.words(),
			url: faker.internet.url(),
		};
		const sut = new CommonCartridgeWebLinkResourceV130(props);

		return { sut, props };
	};

	describe('canInline', () => {
		describe('when using Common Cartridge version 1.3.0', () => {
			it('should return false', () => {
				const { sut } = setup();
				const result = sut.canInline();

				expect(result).toBe(false);
			});
		});
	});

	describe('getFilePath', () => {
		describe('when using Common Cartridge version 1.3.0', () => {
			it('should return the constructed file path', () => {
				const { sut, props } = setup();
				const result = sut.getFilePath();

				expect(result).toBe(`${props.folder}/${props.identifier}.xml`);
			});
		});
	});

	describe('getFileContent', () => {
		it('should contain correct XML header', () => {
			const { sut } = setup();
			const result = sut.getFileContent();

			expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		});

		it('should contain correct XML root element', () => {
			const { sut } = setup();
			const result = sut.getFileContent();

			expect(result).toContain('<webLink');
			expect(result).toContain('</webLink>');
		});

		it('should contain correct XML namespace', () => {
			const { sut } = setup();
			const result = sut.getFileContent();

			expect(result).toContain('xmlns="http://www.imsglobal.org/xsd/imsccv1p1/imswl_v1p1"');
			expect(result).toContain('xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"');
			expect(result).toContain(
				'xsi:schemaLocation="' +
					'http://www.imsglobal.org/xsd/imsccv1p1/imswl_v1p1 https://www.imsglobal.org/sites/default/files/profile/cc/ccv1p1/ccv1p1_imswl_v1p1.xsd"'
			);
		});

		it('should contain correct title', () => {
			const { sut, props } = setup();
			const result = sut.getFileContent();

			expect(result).toContain(`<title>${props.title}</title>`);
		});

		it('should contain correct url', () => {
			const { sut, props } = setup();
			const result = sut.getFileContent();

			expect(result).toContain(`<url href="${props.url}"`);
		});

		// FIXME: add to props
		// Skipping these tests because values are hardcoded in the implementation
		it.skip('should contain correct target', () => {
			const { sut } = setup();
			const result = sut.getFileContent();

			expect(result).toContain(`target="_self"`);
		});

		// FIXME: add to props
		// Skipping these tests because values are hardcoded in the implementation
		it.skip('should contain correct window features', () => {
			const { sut } = setup();
			const result = sut.getFileContent();

			expect(result).toContain(`windowFeatures="width=100, height=100"`);
		});
	});

	describe('getSupportedVersion', () => {
		describe('when using Common Cartridge version 1.3.0', () => {
			it('should return the supported version', () => {
				const { sut } = setup();
				const result = sut.getSupportedVersion();

				expect(result).toBe(CommonCartridgeVersion.V_1_3_0);
			});
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when using Common Cartridge version 1.3.0', () => {
			it('should return the manifest XML object', () => {
				const { sut, props } = setup();
				const result = sut.getManifestXmlObject();

				expect(result).toEqual({
					$: {
						identifier: props.identifier,
						type: props.type,
					},
					file: {
						$: {
							href: sut.getFilePath(),
						},
					},
				});
			});
		});
	});
});
