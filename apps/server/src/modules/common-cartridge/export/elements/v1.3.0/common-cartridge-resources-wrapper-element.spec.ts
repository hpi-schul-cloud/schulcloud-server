import { InternalServerErrorException } from '@nestjs/common';
import { createCommonCartridgeResourcesWrapperElementPropsV130 } from '../../../testing/common-cartridge-element-props.factory';
import { createCommonCartridgeWeblinkResourcePropsV130 } from '../../../testing/common-cartridge-resource-props.factory';
import { CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeResourceFactory } from '../../resources/common-cartridge-resource-factory';
import { CommonCartridgeResourcesWrapperElementV130 } from './common-cartridge-resources-wrapper-element';

describe('CommonCartridgeResourcesWrapperElementV130', () => {
	describe('getSupportedVersion', () => {
		describe('when using common cartridge version 1.3.0', () => {
			const setup = () => {
				const props = createCommonCartridgeResourcesWrapperElementPropsV130();
				const sut = new CommonCartridgeResourcesWrapperElementV130(props);

				return { sut };
			};

			it('should return correct version', () => {
				const { sut } = setup();

				const result = sut.getSupportedVersion();

				expect(result).toBe(CommonCartridgeVersion.V_1_3_0);
			});
		});

		describe('when using not supported common cartridge version', () => {
			const notSupportedProps = createCommonCartridgeResourcesWrapperElementPropsV130();
			notSupportedProps.version = CommonCartridgeVersion.V_1_1_0;

			it('should throw error', () => {
				expect(() => new CommonCartridgeResourcesWrapperElementV130(notSupportedProps)).toThrowError(
					InternalServerErrorException
				);
			});
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when using common cartridge version 1.3.0', () => {
			const setup = () => {
				const weblinkResourceProps = createCommonCartridgeWeblinkResourcePropsV130();
				const props = createCommonCartridgeResourcesWrapperElementPropsV130([
					CommonCartridgeResourceFactory.createResource(weblinkResourceProps),
				]);
				const sut = new CommonCartridgeResourcesWrapperElementV130(props);

				return { sut, weblinkResourceProps };
			};

			it('should return correct manifest xml object', () => {
				const { sut, weblinkResourceProps } = setup();

				const result = sut.getManifestXmlObject();

				expect(result).toStrictEqual({
					resources: [
						{
							resource: [
								{
									$: {
										identifier: weblinkResourceProps.identifier,
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
	});
});
