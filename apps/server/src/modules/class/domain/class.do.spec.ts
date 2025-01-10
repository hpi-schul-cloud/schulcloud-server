import { ObjectId } from 'bson';
import { ClassFactory } from './class.factory';

describe('Class', () => {
	describe('addTeacher', () => {
		describe('When teacher is added to the class', () => {
			const setup = () => {
				const class1 = ClassFactory.create();
				const teacherId = new ObjectId().toHexString();

				class1.addTeacher(teacherId);

				return {
					class1,
					teacherId,
				};
			};

			it('should add the teacher to the teacherIds', () => {
				const { class1, teacherId } = setup();

				class1.addTeacher(teacherId);

				expect(class1.teacherIds).toContain(teacherId);
			});

			it('should add id only once', () => {
				const { class1, teacherId } = setup();

				class1.addTeacher(teacherId);
				class1.addTeacher(teacherId);

				expect(class1.teacherIds).toHaveLength(1);
				expect(class1.teacherIds).toContain(teacherId);
			});
		});
	});

	describe('addUser', () => {
		describe('When user is added to the class', () => {
			const setup = () => {
				const class1 = ClassFactory.create();
				const userId = new ObjectId().toHexString();

				class1.addUser(userId);

				return {
					class1,
					userId,
				};
			};

			it('should add the user to the userIds', () => {
				const { class1, userId } = setup();

				class1.addUser(userId);

				expect(class1.userIds).toContain(userId);
			});

			it('should add id only once', () => {
				const { class1, userId } = setup();

				class1.addUser(userId);
				class1.addUser(userId);

				expect(class1.userIds).toHaveLength(1);
				expect(class1.userIds).toContain(userId);
			});
		});
	});
});
