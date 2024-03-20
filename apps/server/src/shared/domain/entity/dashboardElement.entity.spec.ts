import { BadRequestException } from '@nestjs/common';

import { LearnroomMetadata, LearnroomTypes } from '@shared/domain/types';
import { GridElement } from './dashboard.entity';

const learnroomMock = (id: string, name: string) => {
	return {
		getMetadata(): LearnroomMetadata {
			return {
				id,
				type: LearnroomTypes.Course,
				title: name,
				shortTitle: name.substr(0, 2),
				displayColor: '#ACACAC',
				isSynchronized: false,
			};
		},
	};
};

describe('dashboardElement', () => {
	describe('constructors', () => {
		describe('fromSingleReference', () => {
			const dashboardElement = GridElement.FromSingleReference(learnroomMock('referenceId', 'Calendar-Dashboard'));
			expect(dashboardElement instanceof GridElement);
			expect(dashboardElement.hasId()).toEqual(false);
		});
	});

	describe('isGroup', () => {
		it('element with single reference should not be a group', () => {
			const dashboardElement = GridElement.FromPersistedReference(
				'id',
				learnroomMock('referenceId', 'Calendar-Dashboard')
			);

			expect(dashboardElement.isGroup()).toEqual(false);
		});

		it('element with multiple references should be a group', () => {
			const element = GridElement.FromPersistedGroup('id', 'title', [
				learnroomMock('referenceId', 'Calendar-Dashboard'),
				learnroomMock('anotherReferenceId', 'Team-Dashboard'),
			]);

			expect(element.isGroup()).toEqual(true);
		});
	});

	describe('getContent', () => {
		describe('when Element has a single reference', () => {
			it('should return the metadata of that element', () => {
				const element = GridElement.FromPersistedReference('id', learnroomMock('referenceId', 'Calendar-Dashboard'));
				const content = element.getContent();
				expect(content.referencedId).toEqual('referenceId');
				expect(content.title).toEqual('Calendar-Dashboard');
			});
		});
		describe('when Element has multiple references', () => {
			it('should return the metadata of all those elements', () => {
				const element = GridElement.FromPersistedGroup('id', 'groupTitle', [
					learnroomMock('referenceId', 'Calendar-Dashboard'),
					learnroomMock('anotherReferenceId', 'Team-Dashboard'),
				]);
				const content = element.getContent();
				expect(content.group?.length).toEqual(2);
				if (content.group) {
					expect(content.groupId).toEqual('id');
					expect(content.group[0].shortTitle).toEqual('Ca');
					expect(content.group[1].shortTitle).toEqual('Te');
					expect(content.title).toEqual('groupTitle');
				}
			});

			it('should sort the references', () => {
				const element = GridElement.FromPersistedGroup('id', 'groupTitle', [
					learnroomMock('anotherReferenceId', 'Team-Dashboard'),
					learnroomMock('referenceId', 'Calendar-Dashboard'),
				]);
				const content = element.getContent();
				expect(content.group?.length).toEqual(2);
				if (content.group) {
					expect(content.group[0].shortTitle).toEqual('Ca');
					expect(content.group[1].shortTitle).toEqual('Te');
					expect(content.title).toEqual('groupTitle');
				}
			});

			it('should sort in a stable way', () => {
				const first = learnroomMock('first', 'title');
				const second = learnroomMock('second', 'title');
				const element = GridElement.FromPersistedGroup('id', 'groupTitle', [first, second]);
				const content = element.getContent();
				expect(content.group?.length).toEqual(2);
				if (content.group) {
					expect(content.group[0].id).toEqual('first');
					expect(content.group[1].id).toEqual('second');
				}
			});
		});
	});

	describe('removeReferenceByIndex', () => {
		it('should remove a single reference', () => {
			const element = GridElement.FromGroup('title', [
				learnroomMock('referenceId', 'Calendar-Dashboard'),
				learnroomMock('anotherReferenceId', 'Team-Dashboard'),
			]);
			element.removeReferenceByIndex(1);
			expect(element.getReferences().length).toEqual(1);
			expect(element.getReferences()[0].getMetadata().id).toEqual('referenceId');
		});

		it('should throw if not group', () => {
			const element = GridElement.FromSingleReference(learnroomMock('referenceId', 'Calendar-Dashboard'));
			const callFunction = () => element.removeReferenceByIndex(0);
			expect(callFunction).toThrow(BadRequestException);
		});

		it('should throw for index out of bounds', () => {
			const element = GridElement.FromGroup('title', [
				learnroomMock('referenceId', 'Calendar-Dashboard'),
				learnroomMock('anotherReferenceId', 'Team-Dashboard'),
			]);
			const callFunction = () => element.removeReferenceByIndex(2);
			expect(callFunction).toThrow(BadRequestException);
		});
	});

	describe('removeReference', () => {
		it('should throw if element doesnt exist', () => {
			const element = GridElement.FromGroup('title', [
				learnroomMock('referenceId', 'Calendar-Dashboard'),
				learnroomMock('anotherReferenceId', 'Team-Dashboard'),
			]);
			const callFunction = () => element.removeReference(learnroomMock('notmatching', 'Administration-Dashboard'));
			expect(callFunction).toThrow(BadRequestException);
		});
	});

	describe('addReferences', () => {
		describe('when Element has a single reference', () => {
			const element = GridElement.FromPersistedReference('id', learnroomMock('referenceId', 'Calendar-Dashboard'));
			const referenceList = [learnroomMock('anotherReferenceId', 'Team-Dashboard')];
			element.addReferences(referenceList);
			it('should append references', () => {
				const result = element.getReferences();
				expect(result.length).toEqual(2);
				expect(result[1].getMetadata().title).toEqual('Team-Dashboard');
			});
			it('should set default group name', () => {
				const result = element.getContent();
				expect(result.title).toEqual('');
			});
		});
		describe('when Element has multiple references', () => {
			it('should add all references and not change title', () => {
				const element = GridElement.FromPersistedGroup('id', 'title', [
					learnroomMock('referenceId', 'Calendar-Dashboard'),
					learnroomMock('anotherReferenceId', 'Team-Dashboard'),
				]);
				const referenceList = [learnroomMock('additionalReferenceId', 'Homework-Dashboard')];
				element.addReferences(referenceList);
				const result = element.getReferences();
				expect(result.length).toEqual(3);
				expect(result.some((el) => el.getMetadata().title === 'Homework-Dashboard')).toBeTruthy();
				expect(result.some((el) => el.getMetadata().title === 'Team-Dashboard')).toBeTruthy();
				expect(element.getContent().title).toEqual('title');
			});
			it('should reset title when elements are ungrouped and regrouped', () => {
				const element = GridElement.FromPersistedGroup('id', 'title', [
					learnroomMock('referenceId', 'Calendar-Dashboard'),
					learnroomMock('anotherReferenceId', 'Team-Dashboard'),
				]);
				expect(element.getContent().title).toEqual('title');
				expect(element.getReferences().length).toEqual(2);
				element.removeReferenceByIndex(1);
				expect(element.getReferences().length).toEqual(1);
				const referenceList = [learnroomMock('anotherReferenceId', 'Team-Dashboard')];
				element.addReferences(referenceList);
				expect(element.getReferences().length).toEqual(2);
				expect(element.getContent().title).toEqual('');
			});
			it('should keep references sorted', () => {
				const element = GridElement.FromPersistedGroup('id', 'title', [
					learnroomMock('referenceId', 'Calendar-Dashboard'),
					learnroomMock('anotherReferenceId', 'Team-Dashboard'),
				]);
				const referenceList = [learnroomMock('additionalReferenceId', 'Homework-Dashboard')];
				element.addReferences(referenceList);
				const result = element.getReferences();
				expect(result.length).toEqual(3);
				expect(result[0].getMetadata().title).toEqual('Calendar-Dashboard');
				expect(result[1].getMetadata().title).toEqual('Homework-Dashboard');
				expect(result[2].getMetadata().title).toEqual('Team-Dashboard');
			});
		});
	});

	describe('setGroupName', () => {
		describe('when new group name is set', () => {
			it('should contain the new name as title', () => {
				const element = GridElement.FromPersistedGroup('id', 'oldTitle', [
					learnroomMock('referenceId', 'Calendar-Dashboard'),
					learnroomMock('anotherReferenceId', 'Team-Dashboard'),
				]);
				element.setGroupName('newTitle');
				expect(element.title).toEqual('newTitle');
			});
		});
		describe('when element is no group', () => {
			it('setGroupName should not change title', () => {
				const element = GridElement.FromPersistedReference('id', learnroomMock('referenceId', 'Calendar-Dashboard'));
				element.setGroupName('newTitle');
				expect(element.isGroup()).toEqual(false);
				expect(element.title).toBeUndefined();
			});
		});
	});
});
