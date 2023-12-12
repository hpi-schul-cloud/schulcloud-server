import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeElement } from '../../interfaces/common-cartridge-element.interface';
import {
	CommonCartridgeOrganizationElementPropsV130,
	CommonCartridgeOrganizationElementV130,
} from './common-cartridge-organization-element';

describe('CommonCartridgeOrganizationElementV130', () => {
	const setup = () => {
		const item: DeepMocked<CommonCartridgeElement> = createMock<CommonCartridgeElement>();

		const props: CommonCartridgeOrganizationElementPropsV130 = {
			type: CommonCartridgeElementType.ORGANIZATION,
			version: CommonCartridgeVersion.V_1_3_0,
			identifier: faker.string.uuid(),
			title: faker.lorem.words(),
			items: [item],
		};
		const sut = new CommonCartridgeOrganizationElementV130(props);

		item.getManifestXmlObject.mockReturnValueOnce({});
		item.getSupportedVersion.mockReturnValueOnce(CommonCartridgeVersion.V_1_3_0);

		return { sut, props };
	};

	describe('getSupportedVersion', () => {
		describe('when using common cartridge version 1.3.0', () => {
			it('should return correct version', () => {
				const { sut } = setup();
				const result = sut.getSupportedVersion();

				expect(result).toBe(CommonCartridgeVersion.V_1_3_0);
			});
		});
	});

	describe('getManifestXmlObject', () => {
		describe('when using common cartridge version 1.3.0', () => {
			it('should return correct manifest xml object', () => {
				const { sut, props } = setup();
				const result = sut.getManifestXmlObject();

				expect(result).toStrictEqual({
					$: {
						identifier: props.identifier,
					},
					title: props.title,
					item: [{}],
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
