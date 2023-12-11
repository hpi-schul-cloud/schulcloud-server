import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeElement } from '../../interfaces/common-cartridge-element.interface';
import {
	CommonCartridgeResourcesWrapperElementPropsV110,
	CommonCartridgeResourcesWrapperElementV110,
} from './common-cartridge-resources-wrapper-element';

describe('CommonCartridgeResourcesWrapperElementV110', () => {
	const setup = () => {
		const item: DeepMocked<CommonCartridgeElement> = createMock<CommonCartridgeElement>();

		const props: CommonCartridgeResourcesWrapperElementPropsV110 = {
			type: CommonCartridgeElementType.RESOURCES_WRAPPER,
			version: CommonCartridgeVersion.V_1_1_0,
			items: [item],
		};
		const sut = new CommonCartridgeResourcesWrapperElementV110(props);

		item.getManifestXmlObject.mockReturnValueOnce({
			resources: [
				{
					resource: [
						{
							$: {
								identifier: 'resource-1',
							},
						},
					],
				},
			],
		});
		item.getSupportedVersion.mockReturnValueOnce(CommonCartridgeVersion.V_1_1_0);

		return { sut, props };
	};

	describe('getSupportedVersion', () => {
		describe('when using common cartridge version 1.1.0', () => {
			it('should return correct version', () => {
				const { sut } = setup();
				const result = sut.getSupportedVersion();

				expect(result).toBe(CommonCartridgeVersion.V_1_1_0);
			});
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when using common cartridge version 1.1.0', () => {
			it('should return correct manifest xml object', () => {
				const { sut } = setup();
				const result = sut.getManifestXmlObject();

				expect(result).toStrictEqual({
					resources: [
						{
							resource: [{}],
						},
					],
				});
			});

			it('should call getManifestXmlObject on item', () => {
				const { sut, props } = setup();
				sut.getManifestXmlObject();

				expect(props.items[0].getManifestXmlObject).toHaveBeenCalledTimes(1);
			});
		});
	});
});
