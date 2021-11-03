import { BadRequestException } from '@nestjs/common';
import { GridElement } from './dashboard.entity';

const firstGridReference = {
	getMetadata: () => ({
		id: 'referenceId',
		title: 'Calendar-Dashboard',
		shortTitle: 'CAL',
		displayColor: '#FFFFFF',
	}),
};

const secondGridReference = {
	getMetadata: () => ({
		id: 'additionalReferenceId',
		title: 'Homework-Dashboard',
		shortTitle: 'HOM',
		displayColor: '#010101',
	}),
};

const thirdGridReference = {
	getMetadata: () => ({
		id: 'anotherReferenceId',
		title: 'Team-Dashboard',
		shortTitle: 'TEA',
		displayColor: '#000000',
	}),
};

describe('dashboardElement', () => {
	describe('constructors', () => {
		describe('fromSingleReference', () => {
			const dashboardElement = GridElement.FromSingleReference(firstGridReference);
			expect(dashboardElement instanceof GridElement);
			expect(dashboardElement.hasId()).toEqual(false);
		});
	});

	describe('isGroup', () => {
		it('element with single reference should not be a group', () => {
			const dashboardElement = GridElement.FromPersistedReference('id', firstGridReference);

			expect(dashboardElement.isGroup()).toEqual(false);
		});

		it('element with multiple references should be a group', () => {
			const element = GridElement.FromPersistedGroup('id', 'title', [firstGridReference, thirdGridReference]);

			expect(element.isGroup()).toEqual(true);
		});
	});

	describe('getContent', () => {
		describe('when Element has a single reference', () => {
			it('should return the metadata of that element', () => {
				const element = GridElement.FromPersistedReference('id', firstGridReference);
				const content = element.getContent();
				expect(content.referencedId).toEqual('referenceId');
				expect(content.title).toEqual('Calendar-Dashboard');
			});
		});
		describe('when Element has multiple references', () => {
			it('should return the metadata of all those elements', () => {
				const element = GridElement.FromPersistedGroup('id', 'groupTitle', [firstGridReference, thirdGridReference]);
				const content = element.getContent();
				expect(content.group?.length).toEqual(2);
				if (content.group) {
					expect(content.group[0].shortTitle).toEqual('CAL');
					expect(content.group[1].shortTitle).toEqual('TEA');
					expect(content.title).toEqual('groupTitle');
				}
			});

			it('should sort the references', () => {
				const element = GridElement.FromPersistedGroup('id', 'groupTitle', [thirdGridReference, firstGridReference]);
				const content = element.getContent();
				expect(content.group?.length).toEqual(2);
				if (content.group) {
					expect(content.group[0].shortTitle).toEqual('CAL');
					expect(content.group[1].shortTitle).toEqual('TEA');
					expect(content.title).toEqual('groupTitle');
				}
			});
		});
	});

	describe('removeReference', () => {
		it('should remove a single reference', () => {
			const element = GridElement.FromGroup('title', [firstGridReference, thirdGridReference]);
			element.removeReference(1);
			expect(element.getReferences().length).toEqual(1);
			expect(element.getReferences()[0].getMetadata().id).toEqual('referenceId');
		});

		it('should throw if not group', () => {
			const element = GridElement.FromSingleReference(firstGridReference);
			const callFunction = () => element.removeReference(0);
			expect(callFunction).toThrow(BadRequestException);
		});

		it('should throw for index out of bounds', () => {
			const element = GridElement.FromGroup('title', [firstGridReference, thirdGridReference]);
			const callFunction = () => element.removeReference(2);
			expect(callFunction).toThrow(BadRequestException);
		});
	});

	describe('addReferences', () => {
		describe('when Element has a single reference', () => {
			it('should append references', () => {
				const element = GridElement.FromPersistedReference('id', firstGridReference);
				const referenceList = [thirdGridReference];
				element.addReferences(referenceList);
				const result = element.getReferences();
				expect(result.length).toEqual(2);
				expect(result[1].getMetadata().title).toEqual('Team-Dashboard');
			});
		});
		describe('when Element has multiple references', () => {
			it('should add all references', () => {
				const element = GridElement.FromPersistedGroup('id', 'title', [firstGridReference, thirdGridReference]);
				const referenceList = [secondGridReference];
				element.addReferences(referenceList);
				const result = element.getReferences();
				expect(result.length).toEqual(3);
				expect(result.some((el) => el.getMetadata().title === 'Homework-Dashboard')).toBeTruthy();
				expect(result.some((el) => el.getMetadata().title === 'Team-Dashboard')).toBeTruthy();
			});
		});

		it('should keep references sorted', () => {
			const element = GridElement.FromPersistedGroup('id', 'title', [firstGridReference, thirdGridReference]);
			const referenceList = [secondGridReference];
			element.addReferences(referenceList);
			const result = element.getReferences();
			expect(result.length).toEqual(3);
			expect(result[0].getMetadata().title).toEqual('Calendar-Dashboard');
			expect(result[1].getMetadata().title).toEqual('Homework-Dashboard');
			expect(result[2].getMetadata().title).toEqual('Team-Dashboard');
		});
	});

	describe('setGroupName', () => {
		describe('when new group name is set', () => {
			it('should contain the new name as title', () => {
				const element = GridElement.FromPersistedGroup('id', 'oldTitle', [firstGridReference, thirdGridReference]);
				element.setGroupName('newTitle');
				expect(element.title).toEqual('newTitle');
			});
		});
		describe('when element is no group', () => {
			it('setGroupName should not change title', () => {
				const element = GridElement.FromPersistedReference('id', firstGridReference);
				element.setGroupName('newTitle');
				expect(element.isGroup()).toEqual(false);
				expect(element.title).toBeUndefined();
			});
		});
	});
});
