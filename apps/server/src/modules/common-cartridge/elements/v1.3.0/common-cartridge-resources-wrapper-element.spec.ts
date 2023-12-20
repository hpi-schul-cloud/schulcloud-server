import { faker } from '@faker-js/faker';
import {
	CommonCartridgeElementType,
	CommonCartridgeResourceType,
	CommonCartridgeVersion,
} from '../../common-cartridge.enums';
import {
	CommonCartridgeResourceFactory,
	CommonCartridgeResourceProps,
} from '../../resources/common-cartridge-resource-factory';
import { CommonCartridgeResourcesWrapperElementPropsV110 } from '../v1.1.0/common-cartridge-resources-wrapper-element';
import {
	CommonCartridgeResourcesWrapperElementPropsV130,
	CommonCartridgeResourcesWrapperElementV130,
} from './common-cartridge-resources-wrapper-element';

describe('CommonCartridgeResourcesWrapperElementV130', () => {
	const setup = () => {
		const resourceProps: CommonCartridgeResourceProps = {
			type: CommonCartridgeResourceType.WEB_LINK,
			identifier: faker.string.uuid(),
			title: faker.lorem.words(),
			url: faker.internet.url(),
		};
		const props: CommonCartridgeResourcesWrapperElementPropsV110 = {
			type: CommonCartridgeElementType.RESOURCES_WRAPPER,
			version: CommonCartridgeVersion.V_1_3_0,
			items: [
				CommonCartridgeResourceFactory.createResource({
					...resourceProps,
					version: CommonCartridgeVersion.V_1_3_0,
					folder: faker.string.alphanumeric(10),
				}),
			],
		};
		const sut = new CommonCartridgeResourcesWrapperElementV130(props);

		return { sut, props, resourceProps };
	};

	describe('getSupportedVersion', () => {
		describe('when using common cartridge version 1.3.0', () => {
			it('should return correct version', () => {
				const { sut } = setup();
				const result = sut.getSupportedVersion();

				expect(result).toBe(CommonCartridgeVersion.V_1_3_0);
			});
		});

		describe('when using not supported common cartridge version', () => {
			it('should throw error', () => {
				expect(
					() =>
						new CommonCartridgeResourcesWrapperElementV130({
							type: CommonCartridgeElementType.RESOURCES_WRAPPER,
							version: CommonCartridgeVersion.V_1_1_0,
						} as CommonCartridgeResourcesWrapperElementPropsV130)
				).toThrowError();
			});
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when using common cartridge version 1.3.0', () => {
			it('should return correct manifest xml object', () => {
				const { sut, resourceProps } = setup();
				const result = sut.getManifestXmlObject();

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
	});
});
