import { CommonCartridgeOrganizationsWrapperElement } from './common-cartridge-organizations-wrapper-element';

describe('CommonCartridgeOrganizationsWrapperElement', () => {
	const sut = new CommonCartridgeOrganizationsWrapperElement([
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

	describe('getManifestXmlObject', () => {
		describe('when building common cartridge manifest', () => {
			it('should return correct xml object', () => {
				const xmlObject = sut.getManifestXmlObject();

				expect(xmlObject).toStrictEqual({
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
});
