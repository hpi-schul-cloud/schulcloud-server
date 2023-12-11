import { faker } from '@faker-js/faker';
import { CommonCartridgeResourceType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import {
	CommonCartridgeWebLinkResourcePropsV110,
	CommonCartridgeWebLinkResourceV110,
} from './common-cartridge-web-link-resource';

describe('CommonCartridgeWebLinkResourceV110', () => {
	const setup = () => {
		const props: CommonCartridgeWebLinkResourcePropsV110 = {
			type: CommonCartridgeResourceType.WEB_LINK,
			version: CommonCartridgeVersion.V_1_1_0,
			identifier: faker.string.uuid(),
			folder: faker.string.uuid(),
			title: faker.lorem.words(),
			url: faker.internet.url(),
			target: faker.lorem.word(),
			windowFeatures: faker.lorem.words(),
		};
		const sut = new CommonCartridgeWebLinkResourceV110(props);

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
		it('should contain correct XML', () => {
			const { sut, props } = setup();
			const result = sut.getFileContent();

			expect(result).toEqual(
				'<?xml version="1.0" encoding="UTF-8"?>' +
					'<webLink xmlns="http://www.imsglobal.org/xsd/imsccv1p1/imswl_v1p1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imsccv1p1/imswl_v1p1 http://www.imsglobal.org/profile/cc/ccv1p1/ccv1p1_imswl_v1p1.xsd">' +
					`<title>${props.title}</title>` +
					`<url href="${props.url}" target="${props.target as string}" windowFeatures="${
						props.windowFeatures as string
					}"/>` +
					'</webLink>'
			);
		});
	});

	describe('getSupportedVersion', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			it('should return the supported version', () => {
				const { sut } = setup();
				const result = sut.getSupportedVersion();

				expect(result).toBe(CommonCartridgeVersion.V_1_1_0);
			});
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			it('should return the manifest XML object', () => {
				const { sut, props } = setup();
				const result = sut.getManifestXmlObject();

				expect(result).toEqual({
					resource: {
						$: {
							identifier: props.identifier,
							type: 'imswl_xmlv1p1',
						},
						file: {
							$: {
								href: sut.getFilePath(),
							},
						},
					},
				});
			});
		});
	});
});
