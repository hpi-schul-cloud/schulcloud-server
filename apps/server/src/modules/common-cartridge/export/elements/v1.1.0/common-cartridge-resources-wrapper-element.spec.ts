import { createCommonCartridgeResourcesWrapperElementPropsV110 } from '../../../testing/common-cartridge-element-props.factory';
import { createCommonCartridgeWeblinkResourcePropsV110 } from '../../../testing/common-cartridge-resource-props.factory';
import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { ElementTypeNotSupportedLoggableException, VersionNotSupportedLoggableException } from '../../errors';
import { CommonCartridgeResourceFactory } from '../../resources/common-cartridge-resource-factory';
import { CommonCartridgeResourcesWrapperElementV110 } from './common-cartridge-resources-wrapper-element';

describe('CommonCartridgeResourcesWrapperElementV110', () => {
	describe('getSupportedVersion', () => {
		describe('when using common cartridge version 1.1.0', () => {
			const setup = () => {
				const props = createCommonCartridgeResourcesWrapperElementPropsV110();
				const sut = new CommonCartridgeResourcesWrapperElementV110(props);

				return { sut };
			};

			it('should return correct version', () => {
				const { sut } = setup();

				const result = sut.getSupportedVersion();

				expect(result).toBe(CommonCartridgeVersion.V_1_1_0);
			});
		});

		describe('when using not supported common cartridge version', () => {
			const notSupportedProps = createCommonCartridgeResourcesWrapperElementPropsV110();
			notSupportedProps.version = CommonCartridgeVersion.V_1_3_0;

			it('should throw error', () => {
				expect(() => new CommonCartridgeResourcesWrapperElementV110(notSupportedProps)).toThrow(
					VersionNotSupportedLoggableException
				);
			});
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when creating resources wrapper xml object', () => {
			const setup = () => {
				const resourceProps = createCommonCartridgeWeblinkResourcePropsV110();
				const props = createCommonCartridgeResourcesWrapperElementPropsV110([
					CommonCartridgeResourceFactory.createResource(resourceProps),
				]);
				const sut = new CommonCartridgeResourcesWrapperElementV110(props);

				return { sut, resourceProps };
			};

			it('should return resources wrapper manifest fragment', () => {
				const { sut, resourceProps } = setup();

				const result = sut.getManifestXmlObject(CommonCartridgeElementType.RESOURCES_WRAPPER);

				expect(result).toStrictEqual({
					resources: [
						{
							resource: [
								{
									$: {
										identifier: resourceProps.identifier,
										type: expect.any(String),
									},
									file: {
										$: {
											href: expect.any(String),
										},
									},
								},
							],
						},
					],
				});
			});
		});

		describe('when using unsupported element type', () => {
			const setup = () => {
				const unknownElementType = 'unknown' as CommonCartridgeElementType;
				const props = createCommonCartridgeResourcesWrapperElementPropsV110();
				const sut = new CommonCartridgeResourcesWrapperElementV110(props);

				return { sut, unknownElementType };
			};

			it('should throw error', () => {
				const { sut, unknownElementType } = setup();

				expect(() => sut.getManifestXmlObject(unknownElementType)).toThrow(ElementTypeNotSupportedLoggableException);
			});
		});
	});
});
