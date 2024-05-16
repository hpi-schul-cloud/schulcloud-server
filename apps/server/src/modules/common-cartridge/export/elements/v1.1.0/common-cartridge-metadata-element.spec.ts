import { createCommonCartridgeMetadataElementPropsV110 } from '../../../testing/common-cartridge-element-props.factory';
import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { ElementTypeNotSupportedLoggableException, VersionNotSupportedLoggableException } from '../../errors';
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
				expect(() => new CommonCartridgeMetadataElementV110(notSupportedProps)).toThrow(
					VersionNotSupportedLoggableException
				);
			});
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when creating metadata xml object', () => {
			const setup = () => {
				const props = createCommonCartridgeMetadataElementPropsV110();
				const sut = new CommonCartridgeMetadataElementV110(props);

				return { sut, props };
			};

			it('should return metadata manifest fragment', () => {
				const { sut, props } = setup();

				const result = sut.getManifestXmlObject(CommonCartridgeElementType.METADATA);

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

		describe('when using unsupported element type', () => {
			const setup = () => {
				const unknownElementType = 'unknown' as CommonCartridgeElementType;
				const props = createCommonCartridgeMetadataElementPropsV110();
				const sut = new CommonCartridgeMetadataElementV110(props);

				return { sut, unknownElementType };
			};

			it('should throw error', () => {
				const { sut, unknownElementType } = setup();

				expect(() => sut.getManifestXmlObject(unknownElementType)).toThrow(ElementTypeNotSupportedLoggableException);
			});
		});
	});
});
