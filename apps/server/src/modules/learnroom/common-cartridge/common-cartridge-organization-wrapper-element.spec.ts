import { ICommonCartridgeElement } from './common-cartridge-element.interface';
import { CommonCartridgeOrganizationWrapperElement } from './common-cartridge-organization-wrapper-element';

describe('CommonCartridgeOrganizationWrapperElement', () => {
	it('should transform the organization elements into the expected structure', () => {
		const organizationElementsMock: ICommonCartridgeElement[] = [
			{
				transform: jest.fn().mockReturnValue({ identifier: 'element-1' }),
			},
			{
				transform: jest.fn().mockReturnValue({ identifier: 'element-2' }),
			},
		];

		const organizationWrapperElement = new CommonCartridgeOrganizationWrapperElement(organizationElementsMock);
		const result = organizationWrapperElement.transform();

		expect(result).toEqual({
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
							item: [{ identifier: 'element-1' }, { identifier: 'element-2' }],
						},
					],
				},
			],
		});

		expect(organizationElementsMock[0].transform).toHaveBeenCalled();
		expect(organizationElementsMock[1].transform).toHaveBeenCalled();
	});
});
