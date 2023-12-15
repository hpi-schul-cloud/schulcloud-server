import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { CommonCartridgeElementType, CommonCartridgeVersion } from '../../common-cartridge.enums';
import { CommonCartridgeElement } from '../../interfaces/common-cartridge-element.interface';
import {
	CommonCartridgeOrganizationsWrapperElementPropsV130,
	CommonCartridgeOrganizationsWrapperElementV130,
} from './common-cartridge-organizations-wrapper-element';

describe('CommonCartridgeOrganizationsWrapperElementV130', () => {
	const setup = () => {
		const item: DeepMocked<CommonCartridgeElement> = createMock<CommonCartridgeElement>();

		const props: CommonCartridgeOrganizationsWrapperElementPropsV130 = {
			type: CommonCartridgeElementType.ORGANIZATIONS_WRAPPER,
			version: CommonCartridgeVersion.V_1_3_0,
			items: [item],
		};
		const sut = new CommonCartridgeOrganizationsWrapperElementV130(props);

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
				const { sut } = setup();
				const result = sut.getManifestXmlObject();

				expect(result).toStrictEqual({
					organization: [
						{
							$: {
								identifier: 'org-1',
								structure: 'rooted-hierarchy',
							},
							item: [
								{
									$: {
										identifier: 'LearningModules',
									},
									item: [{}],
								},
							],
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
