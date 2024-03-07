import { InternalServerErrorException } from '@nestjs/common';
import { createCommonCartridgeMetadataElementPropsV130 } from '../../../testing/common-cartridge-element-props.factory';
import { CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeMetadataElementV130 } from './common-cartridge-metadata-element';

describe('CommonCartridgeMetadataElementV130', () => {
	describe('getSupportedVersion', () => {
		describe('when using Common Cartridge version 1.3.0', () => {
			const setup = () => {
				const props = createCommonCartridgeMetadataElementPropsV130();
				const sut = new CommonCartridgeMetadataElementV130(props);

				return { sut, props };
			};

			it('should return correct version', () => {
				const { sut } = setup();

				const result = sut.getSupportedVersion();

				expect(result).toBe(CommonCartridgeVersion.V_1_3_0);
			});
		});

		describe('when using not supported Common Cartridge version', () => {
			const notSupportedProps = createCommonCartridgeMetadataElementPropsV130();
			notSupportedProps.version = CommonCartridgeVersion.V_1_1_0;

			it('should throw error', () => {
				expect(() => new CommonCartridgeMetadataElementV130(notSupportedProps)).toThrow(InternalServerErrorException);
			});
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when using common cartridge version 1.3', () => {
			const setup = () => {
				const props = createCommonCartridgeMetadataElementPropsV130();
				const sut = new CommonCartridgeMetadataElementV130(props);

				return { sut, props };
			};

			it('should return correct manifest xml object', () => {
				const { sut, props } = setup();

				const result = sut.getManifestXmlObject();

				expect(result).toStrictEqual({
					schema: 'IMS Common Cartridge',
					schemaversion: '1.3.0',
					'mnf:lom': {
						'mnf:general': {
							'mnf:title': {
								'mnf:string': props.title,
							},
						},
						'mnf:rights': {
							'mnf:copyrightAndOtherRestrictions': {
								'mnf:value': 'yes',
							},
							'mnf:description': {
								'mnf:string': `${props.creationDate.getFullYear()} ${props.copyrightOwners.join(', ')}`,
							},
						},
					},
				});
			});
		});
	});
});
