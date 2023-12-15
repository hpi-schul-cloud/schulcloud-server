import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeElement } from '../../interfaces/common-cartridge-element.interface';
import {
	CommonCartridgeResourcesWrapperElementPropsV110,
	CommonCartridgeResourcesWrapperElementV110,
} from './common-cartridge-resources-wrapper-element';

describe('CommonCartridgeResourcesWrapperElementV110', () => {
	const setup = () => {
		const item1: DeepMocked<CommonCartridgeElement> = createMock<CommonCartridgeElement>();
		const item2: DeepMocked<CommonCartridgeElement> = createMock<CommonCartridgeElement>();

		item1.getManifestXmlObject.mockReturnValueOnce({
			$: {
				identifier: 'resource-1',
			},
		});
		item1.getSupportedVersion.mockReturnValueOnce(CommonCartridgeVersion.V_1_1_0);

		item2.getManifestXmlObject.mockReturnValueOnce({
			$: {
				identifier: 'resource-2',
			},
		});
		item2.getSupportedVersion.mockReturnValueOnce(CommonCartridgeVersion.V_1_1_0);

		const props: CommonCartridgeResourcesWrapperElementPropsV110 = {
			type: CommonCartridgeElementType.RESOURCES_WRAPPER,
			version: CommonCartridgeVersion.V_1_1_0,
			items: [item1, item2],
		};

		const sut = new CommonCartridgeResourcesWrapperElementV110(props);

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
							resource: [
								{
									$: {
										identifier: 'resource-1',
									},
								},
								{
									$: {
										identifier: 'resource-2',
									},
								},
							],
						},
					],
				});
			});

			it('should call getManifestXmlObject on both items', () => {
				const { sut, props } = setup();
				sut.getManifestXmlObject();

				expect(props.items[0].getManifestXmlObject).toHaveBeenCalledTimes(1);
				expect(props.items[1].getManifestXmlObject).toHaveBeenCalledTimes(1);
			});
		});
	});
});
