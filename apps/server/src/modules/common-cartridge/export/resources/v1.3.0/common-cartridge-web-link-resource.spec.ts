import { InternalServerErrorException } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { createCommonCartridgeWeblinkResourcePropsV130 } from '../../../testing/common-cartridge-resource-props.factory';
import { CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeWebLinkResourceV130 } from './common-cartridge-web-link-resource';

describe('CommonCartridgeWebLinkResourceV130', () => {
	describe('canInline', () => {
		describe('when using Common Cartridge version 1.3.0', () => {
			const setup = () => {
				const props = createCommonCartridgeWeblinkResourcePropsV130();
				const sut = new CommonCartridgeWebLinkResourceV130(props);

				return { sut };
			};

			it('should return false', () => {
				const { sut } = setup();

				const result = sut.canInline();

				expect(result).toBe(false);
			});
		});
	});

	describe('getFilePath', () => {
		describe('when using Common Cartridge version 1.3.0', () => {
			const setup = () => {
				const props = createCommonCartridgeWeblinkResourcePropsV130();
				const sut = new CommonCartridgeWebLinkResourceV130(props);

				return { sut, props };
			};

			it('should return the constructed file path', () => {
				const { sut, props } = setup();

				const result = sut.getFilePath();

				expect(result).toBe(`${props.folder}/${props.identifier}.xml`);
			});
		});
	});

	describe('getFileContent', () => {
		describe('when using Common Cartridge version 1.3.0', () => {
			const setup = () => {
				const props = createCommonCartridgeWeblinkResourcePropsV130();
				props.title = 'Title';
				props.url = 'http://www.example.tld';
				props.target = '_self';
				props.windowFeatures = 'width=100;height=100;';

				const sut = new CommonCartridgeWebLinkResourceV130(props);

				return { sut };
			};

			it('should contain correct XML', async () => {
				const { sut } = setup();

				const expected = await readFile(
					'./apps/server/src/modules/common-cartridge/testing/assets/v1.3.0/weblink.xml',
					'utf8'
				);
				const result = sut.getFileContent();

				expect(result).toEqual(expected);
			});
		});
	});

	describe('getSupportedVersion', () => {
		describe('when using Common Cartridge version 1.3.0', () => {
			const setup = () => {
				const props = createCommonCartridgeWeblinkResourcePropsV130();
				const sut = new CommonCartridgeWebLinkResourceV130(props);

				return { sut };
			};

			it('should return the supported version', () => {
				const { sut } = setup();

				const result = sut.getSupportedVersion();

				expect(result).toBe(CommonCartridgeVersion.V_1_3_0);
			});
		});

		describe('when using not supported Common Cartridge version', () => {
			const notSupportedProps = createCommonCartridgeWeblinkResourcePropsV130();
			notSupportedProps.version = CommonCartridgeVersion.V_1_1_0;

			it('should throw error', () => {
				expect(() => new CommonCartridgeWebLinkResourceV130(notSupportedProps)).toThrow(InternalServerErrorException);
			});
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when using Common Cartridge version 1.3.0', () => {
			const setup = () => {
				const props = createCommonCartridgeWeblinkResourcePropsV130();
				const sut = new CommonCartridgeWebLinkResourceV130(props);

				return { sut, props };
			};

			it('should return the manifest XML object', () => {
				const { sut, props } = setup();

				const result = sut.getManifestXmlObject();

				expect(result).toEqual({
					$: {
						identifier: props.identifier,
						type: 'imswl_xmlv1p3',
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
