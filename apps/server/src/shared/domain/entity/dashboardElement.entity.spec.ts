import { GridElement } from './dashboard.entity';

const gridReference = {
	getMetadata: () => ({
		id: 'referenceId',
		title: 'Calendar-Dashboard',
		shortTitle: 'CAL',
		displayColor: '#FFFFFF',
	}),
};

const anotherGridReference = {
	getMetadata: () => ({
		id: 'anotherReferenceId',
		title: 'Team-Dashboard',
		shortTitle: 'TEA',
		displayColor: '#000000',
	}),
};

const additionalGridReference = {
	getMetadata: () => ({
		id: 'additionalReferenceId',
		title: 'Homework-Dashboard',
		shortTitle: 'HOM',
		displayColor: '#010101',
	}),
};

describe('dashboardElement', () => {
	describe('isGroup', () => {
		it('element with single reference should not be a group', () => {
			const dashboardElement = GridElement.FromSingleReference('id', gridReference);

			expect(dashboardElement.isGroup()).toEqual(false);
		});

		it('element with multiple references should be a group', () => {
			const element = GridElement.FromReferenceGroup('id', [gridReference, anotherGridReference]);

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
		describe('when Element has multiple references', () => {
			it('should return the metadata of all those elements', () => {
				const element = GridElement.FromReferenceGroup('id', [gridReference, anotherGridReference]);
				const content = element.getContent();
				expect(content.group?.length).toEqual(2);
				if (content.group) {
					expect(content.group[0].shortTitle).toEqual('CAL');
					expect(content.group[1].shortTitle).toEqual('TEA');
				}
			});
		});
	});

	describe('addReferences', () => {
		describe('when Element has a single reference', () => {
			it('should append references', () => {
				const element = GridElement.FromSingleReference('id', gridReference);
				const referenceList = [anotherGridReference];
				element.addReferences(referenceList);
				const result = element.getReferences();
				expect(result.length).toEqual(2);
				expect(result[1].getMetadata().title).toEqual('Team-Dashboard');
			});
		});
		describe('when Element has multiple references', () => {
			it('should append all references', () => {
				const element = GridElement.FromReferenceGroup('id', [gridReference, anotherGridReference]);
				const referenceList = [additionalGridReference];
				element.addReferences(referenceList);
				const result = element.getReferences();
				expect(result.length).toEqual(3);
				expect(result[1].getMetadata().title).toEqual('Team-Dashboard');
				expect(result[2].getMetadata().title).toEqual('Homework-Dashboard');
			});
		});
	});
});
