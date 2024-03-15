import { InternalServerErrorException } from '@nestjs/common';
import { createCommonCartridgeWebContentResourcePropsV110 } from '../../../testing/common-cartridge-resource-props.factory';
import { CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeWebContentResourceV110 } from './common-cartridge-web-content-resource';

describe('CommonCartridgeWebContentResourceV110', () => {
	describe('canInline', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			const setup = () => {
				const props = createCommonCartridgeWebContentResourcePropsV110();
				const sut = new CommonCartridgeWebContentResourceV110(props);

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
		describe('when using Common Cartridge version 1.1.0', () => {
			const setup = () => {
				const props = createCommonCartridgeWebContentResourcePropsV110();
				const sut = new CommonCartridgeWebContentResourceV110(props);

				return { sut, props };
			};

			it('should return the constructed file path', () => {
				const { sut, props } = setup();

				const result = sut.getFilePath();

				expect(result).toBe(`${props.folder}/${props.identifier}.html`);
			});
		});
	});

	describe('getFileContent', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			const setup = () => {
				const props = createCommonCartridgeWebContentResourcePropsV110();
				const sut = new CommonCartridgeWebContentResourceV110(props);

				return { sut, props };
			};

			it('should return the HTML', () => {
				const { sut, props } = setup();

				const result = sut.getFileContent();

				expect(result).toBe(props.html);
			});
		});
	});

	describe('getSupportedVersion', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			const setup = () => {
				const props = createCommonCartridgeWebContentResourcePropsV110();
				const sut = new CommonCartridgeWebContentResourceV110(props);

				return { sut };
			};

			it('should return Common Cartridge version 1.1.0', () => {
				const { sut } = setup();

				const result = sut.getSupportedVersion();

				expect(result).toBe(CommonCartridgeVersion.V_1_1_0);
			});
		});

		describe('when using not supported Common Cartridge version', () => {
			const notSupportedProps = createCommonCartridgeWebContentResourcePropsV110();
			notSupportedProps.version = CommonCartridgeVersion.V_1_3_0;

			it('should throw error', () => {
				expect(() => new CommonCartridgeWebContentResourceV110(notSupportedProps)).toThrow(
					InternalServerErrorException
				);
			});
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			const setup = () => {
				const props = createCommonCartridgeWebContentResourcePropsV110();
				const sut = new CommonCartridgeWebContentResourceV110(props);

				return { sut, props };
			};

			it('should return the correct XML object', () => {
				const { sut, props } = setup();

				const result = sut.getManifestXmlObject();

				expect(result).toEqual({
					$: {
						identifier: props.identifier,
						type: 'webcontent',
						intendeduse: props.intendedUse,
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
