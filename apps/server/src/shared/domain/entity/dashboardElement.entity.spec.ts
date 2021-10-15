import { GridElement } from './dashboard.entity';

const gridReference = {
	getMetadata: () => ({
		id: 'referenceId',
		title: 'Calendar-Dashboard',
		shortTitle: 'CAL',
		displayColor: '#FFFFFF',
	}),
};

describe('dashboardElement', () => {
	describe('isGroup', () => {
		it('element with single reference should not be a group', () => {
			const dashboardElement = GridElement.FromSingleReference('id', gridReference);

			expect(dashboardElement.isGroup()).toEqual(false);
		});

		it('element with multiple references should be a group', () => {
			const element = GridElement.FromReferenceGroup('id', [gridReference, gridReference]);

			expect(element.isGroup()).toEqual(true);
		});
	});

	describe('getContent', () => {
		describe('when Element has a single reference', () => {
			it('should return the metadata of that element', () => {
				const element = GridElement.FromSingleReference('id', gridReference);
				const content = element.getContent();
				expect(content.referencedId).toEqual('referenceId');
				expect(content.title).toEqual('Calendar-Dashboard');
			});
		});
	});

	describe('addReferences', () => {
		describe('when Element has a single reference', () => {
			it('should append references', () => {
				const element = GridElement.FromSingleReference('id', gridReference);
				const referenceList = [
					{
						getMetadata: () => ({
							id: 'anotherReferenceId',
							title: 'Team-Dashboard',
							shortTitle: 'TEA',
							displayColor: '#000000',
						}),
					},
				];
				element.addReferences(referenceList);
				const result = element.getReferences();
				expect(result.length).toEqual(2);
				expect(result[1].getMetadata().title).toEqual('Team-Dashboard');
			});
		});
	});
});
