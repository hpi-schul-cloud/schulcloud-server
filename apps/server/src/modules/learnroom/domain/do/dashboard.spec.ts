import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { BadRequestException } from '@nestjs/common';
import { setupEntities } from '@testing/database';
import { GridElement } from './dashboard';

describe('dashboardElement', () => {
	beforeAll(async () => {
		await setupEntities([CourseEntity, CourseGroupEntity]);
	});

	describe('constructors', () => {
		it('fromSingleReference', () => {
			const dashboardElement = GridElement.FromSingleReference(
				courseEntityFactory.buildWithId({ name: 'Calendar-Dashboard' })
			);

			expect(dashboardElement).toBeInstanceOf(GridElement);
			expect(dashboardElement.hasId()).toEqual(false);
		});
	});

	describe('isGroup', () => {
		it('element with single reference should not be a group', () => {
			const dashboardElement = GridElement.FromPersistedReference(
				'id',
				courseEntityFactory.buildWithId({ name: 'Calendar-Dashboard' })
			);

			expect(dashboardElement.isGroup()).toEqual(false);
		});

		it('element with multiple references should be a group', () => {
			const element = GridElement.FromPersistedGroup('id', 'title', [
				courseEntityFactory.buildWithId({ name: 'Calendar-Dashboard' }),
				courseEntityFactory.buildWithId({ name: 'Team-Dashboard' }),
			]);

			expect(element.isGroup()).toEqual(true);
		});
	});

	describe('getContent', () => {
		describe('when Element has a single reference', () => {
			it('should return the metadata of that element', () => {
				const mockCourse = courseEntityFactory.buildWithId({ name: 'Calendar-Dashboard' });
				const element = GridElement.FromPersistedReference('id', mockCourse);
				const content = element.getContent();
				expect(content.referencedId).toEqual(mockCourse.getMetadata().id);
				expect(content.title).toEqual('Calendar-Dashboard');
			});
		});
		describe('when Element has multiple references', () => {
			it('should return the metadata of all those elements', () => {
				const element = GridElement.FromPersistedGroup('id', 'groupTitle', [
					courseEntityFactory.buildWithId({ name: 'Calendar-Dashboard' }),
					courseEntityFactory.buildWithId({ name: 'Team-Dashboard' }),
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
					courseEntityFactory.buildWithId({ name: 'Team-Dashboard' }),
					courseEntityFactory.buildWithId({ name: 'Calendar-Dashboard' }),
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
				const first = courseEntityFactory.buildWithId({ name: 'Calendar-Dashboard' });
				const second = courseEntityFactory.buildWithId({ name: 'Calendar-Dashboard' });
				const element = GridElement.FromPersistedGroup('id', 'groupTitle', [first, second]);
				const content = element.getContent();
				expect(content.group?.length).toEqual(2);
				if (content.group) {
					expect(content.group[0].id).toEqual(first.id);
					expect(content.group[1].id).toEqual(second.id);
				}
			});
		});
	});

	describe('removeReferenceByIndex', () => {
		it('should remove a single reference', () => {
			const mockCourse1 = courseEntityFactory.buildWithId({ name: 'Calendar-Dashboard' });
			const mockCourse2 = courseEntityFactory.buildWithId({ name: 'Team-Dashboard' });
			const element = GridElement.FromGroup('title', [mockCourse1, mockCourse2]);

			element.removeReferenceByIndex(1);

			expect(element.getReferences().length).toEqual(1);
			expect(element.getReferences()[0].getMetadata().id).toEqual(mockCourse1.getMetadata().id);
		});

		it('should throw if not group', () => {
			const element = GridElement.FromSingleReference(courseEntityFactory.buildWithId({ name: 'Calendar-Dashboard' }));
			const callFunction = () => element.removeReferenceByIndex(0);
			expect(callFunction).toThrow(BadRequestException);
		});

		it('should throw for index out of bounds', () => {
			const element = GridElement.FromGroup('title', [
				courseEntityFactory.buildWithId({ name: 'Calendar-Dashboard' }),
				courseEntityFactory.buildWithId({ name: 'Team-Dashboard' }),
			]);
			const callFunction = () => element.removeReferenceByIndex(2);
			expect(callFunction).toThrow(BadRequestException);
		});
	});

	describe('removeReference', () => {
		it('should throw if element doesnt exist', () => {
			const element = GridElement.FromGroup('title', [
				courseEntityFactory.buildWithId({ name: 'Calendar-Dashboard' }),
				courseEntityFactory.buildWithId({ name: 'Team-Dashboard' }),
			]);
			const callFunction = () => element.removeReference(courseEntityFactory.buildWithId({ name: 'Non-Existing' }));
			expect(callFunction).toThrow(BadRequestException);
		});
	});

	describe('addReferences', () => {
		describe('when Element has a single reference', () => {
			const setup = () => {
				const mockCourse = courseEntityFactory.buildWithId({ name: 'Calendar-Dashboard' });
				const element = GridElement.FromPersistedReference('id', mockCourse);
				const referenceList = [courseEntityFactory.buildWithId({ name: 'Team-Dashboard' })];
				element.addReferences(referenceList);

				return element;
			};
			it('should append references', () => {
				const element = setup();

				const result = element.getReferences();

				expect(result.length).toEqual(2);
				expect(result[1].getMetadata().title).toEqual('Team-Dashboard');
			});
			it('should set default group name', () => {
				const element = setup();

				const result = element.getContent();

				expect(result.title).toEqual('');
			});
		});
		describe('when Element has multiple references', () => {
			it('should add all references and not change title', () => {
				const element = GridElement.FromPersistedGroup('id', 'title', [
					courseEntityFactory.buildWithId({ name: 'Calendar-Dashboard' }),
					courseEntityFactory.buildWithId({ name: 'Team-Dashboard' }),
				]);
				const referenceList = [courseEntityFactory.buildWithId({ name: 'Homework-Dashboard' })];
				element.addReferences(referenceList);
				const result = element.getReferences();
				expect(result.length).toEqual(3);
				expect(result.some((el) => el.getMetadata().title === 'Homework-Dashboard')).toBeTruthy();
				expect(result.some((el) => el.getMetadata().title === 'Team-Dashboard')).toBeTruthy();
				expect(element.getContent().title).toEqual('title');
			});
			it('should reset title when elements are ungrouped and regrouped', () => {
				const element = GridElement.FromPersistedGroup('id', 'title', [
					courseEntityFactory.buildWithId({ name: 'Calendar-Dashboard' }),
					courseEntityFactory.buildWithId({ name: 'Team-Dashboard' }),
				]);
				expect(element.getContent().title).toEqual('title');
				expect(element.getReferences().length).toEqual(2);
				element.removeReferenceByIndex(1);
				expect(element.getReferences().length).toEqual(1);
				const referenceList = [courseEntityFactory.buildWithId({ name: 'Team-Dashboard' })];
				element.addReferences(referenceList);
				expect(element.getReferences().length).toEqual(2);
				expect(element.getContent().title).toEqual('');
			});
			it('should keep references sorted', () => {
				const element = GridElement.FromPersistedGroup('id', 'title', [
					courseEntityFactory.buildWithId({ name: 'Calendar-Dashboard' }),
					courseEntityFactory.buildWithId({ name: 'Team-Dashboard' }),
				]);
				const referenceList = [courseEntityFactory.buildWithId({ name: 'Homework-Dashboard' })];
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
					courseEntityFactory.buildWithId({ name: 'Calendar-Dashboard' }),
					courseEntityFactory.buildWithId({ name: 'Team-Dashboard' }),
				]);
				element.setGroupName('newTitle');
				expect(element.title).toEqual('newTitle');
			});
		});
		describe('when element is no group', () => {
			it('setGroupName should not change title', () => {
				const element = GridElement.FromPersistedReference(
					'id',
					courseEntityFactory.buildWithId({ name: 'Calendar-Dashboard' })
				);
				element.setGroupName('newTitle');
				expect(element.isGroup()).toEqual(false);
				expect(element.title).toBeUndefined();
			});
		});
	});
});
