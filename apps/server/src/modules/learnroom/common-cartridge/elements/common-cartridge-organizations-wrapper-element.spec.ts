import { CommonCartridgeOrganizationsWrapperElement } from './common-cartridge-organizations-wrapper-element';

describe('CommonCartridgeOrganizationsWrapperElement', () => {
	// AI next 40 lines
	describe('getManifestXml', () => {
		it('should return the correct xml object', () => {
			const element = new CommonCartridgeOrganizationsWrapperElement([
				{
					getManifestXmlObject: () => {
						return {
							$: {
								identifier: 'identifier',
							},
							title: 'title',
						};
					},
				},
			]);

			expect(element.getManifestXmlObject()).toStrictEqual({
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
								item: [
									{
										$: {
											identifier: 'identifier',
										},
										title: 'title',
									},
								],
							},
						],
					},
				],
			});
		});
	});
});
