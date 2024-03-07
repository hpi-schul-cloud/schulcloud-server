import { InternalServerErrorException } from '@nestjs/common';
import { createCommonCartridgeMetadataElementPropsV110 } from '../../../testing/common-cartridge-element-props.factory';
import { CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeMetadataElementV110 } from './common-cartridge-metadata-element';

describe('CommonCartridgeMetadataElementV110', () => {
	describe('getSupportedVersion', () => {
		describe('when using Common Cartridge version 1.1.0', () => {
			const setup = () => {
				const props = createCommonCartridgeMetadataElementPropsV110();
				const sut = new CommonCartridgeMetadataElementV110(props);

				return { sut, props };
			};

			it('should return correct version', () => {
				const { sut } = setup();

				const result = sut.getSupportedVersion();

				expect(result).toBe(CommonCartridgeVersion.V_1_1_0);
			});
		});

		describe('when using not supported Common Cartridge version', () => {
			const notSupportedProps = createCommonCartridgeMetadataElementPropsV110();
			notSupportedProps.version = CommonCartridgeVersion.V_1_3_0;

			it('should throw error', () => {
				expect(() => new CommonCartridgeMetadataElementV110(notSupportedProps)).toThrow(InternalServerErrorException);
			});
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when using Common Cartridge version 1.1', () => {
			const setup = () => {
				const props = createCommonCartridgeMetadataElementPropsV110();
				const sut = new CommonCartridgeMetadataElementV110(props);

				return { sut, props };
			};

			it('should return correct manifest xml object', () => {
				const { sut, props } = setup();

				const result = sut.getManifestXmlObject();

				expect(result).toStrictEqual({
					schema: 'IMS Common Cartridge',
					schemaversion: '1.1.0',
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
