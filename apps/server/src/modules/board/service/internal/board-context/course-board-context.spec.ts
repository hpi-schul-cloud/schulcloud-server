import { ObjectId } from '@mikro-orm/mongodb';
import { BoardExternalReferenceType, BoardRoles } from '../../../domain';
import { columnBoardFactory } from '../../../testing';
import { CourseBoardContext, CourseBoardContextData } from './course-board-context';

describe(CourseBoardContext.name, () => {
	describe('constructor', () => {
		it('should set the type to Course', () => {
			const data: CourseBoardContextData = {
				teachers: [],
				substitutionTeachers: [],
				students: [],
			};

			const context = new CourseBoardContext(data);

			expect(context.type).toBe(BoardExternalReferenceType.Course);
		});
	});

	describe('getUsersWithBoardRoles', () => {
		describe('when course has no users', () => {
			it('should return empty array', () => {
				const data: CourseBoardContextData = {
					teachers: [],
					substitutionTeachers: [],
					students: [],
				};

				const context = new CourseBoardContext(data);
				const result = context.getUsersWithBoardRoles();

				expect(result).toEqual([]);
			});
		});

		describe('when course has teachers', () => {
			it('should return teachers with EDITOR and ADMIN roles', () => {
				const teacherId = new ObjectId().toHexString();
				const data: CourseBoardContextData = {
					teachers: [{ userId: teacherId, firstName: 'John', lastName: 'Doe' }],
					substitutionTeachers: [],
					students: [],
				};

				const context = new CourseBoardContext(data);
				const result = context.getUsersWithBoardRoles();

				expect(result).toEqual([
					{
						userId: teacherId,
						firstName: 'John',
						lastName: 'Doe',
						roles: [BoardRoles.EDITOR, BoardRoles.ADMIN],
					},
				]);
			});
		});

		describe('when course has substitution teachers', () => {
			it('should return substitution teachers with EDITOR and ADMIN roles', () => {
				const subTeacherId = new ObjectId().toHexString();
				const data: CourseBoardContextData = {
					teachers: [],
					substitutionTeachers: [{ userId: subTeacherId, firstName: 'Jane', lastName: 'Smith' }],
					students: [],
				};

				const context = new CourseBoardContext(data);
				const result = context.getUsersWithBoardRoles();

				expect(result).toEqual([
					{
						userId: subTeacherId,
						firstName: 'Jane',
						lastName: 'Smith',
						roles: [BoardRoles.EDITOR, BoardRoles.ADMIN],
					},
				]);
			});
		});

		describe('when course has students', () => {
			it('should return students with READER role', () => {
				const studentId = new ObjectId().toHexString();
				const data: CourseBoardContextData = {
					teachers: [],
					substitutionTeachers: [],
					students: [{ userId: studentId, firstName: 'Student', lastName: 'One' }],
				};

				const context = new CourseBoardContext(data);
				const result = context.getUsersWithBoardRoles();

				expect(result).toEqual([
					{
						userId: studentId,
						firstName: 'Student',
						lastName: 'One',
						roles: [BoardRoles.READER],
					},
				]);
			});
		});

		describe('when course has all types of users', () => {
			it('should return all users combined in correct order', () => {
				const teacherId = new ObjectId().toHexString();
				const subTeacherId = new ObjectId().toHexString();
				const studentId = new ObjectId().toHexString();
				const data: CourseBoardContextData = {
					teachers: [{ userId: teacherId }],
					substitutionTeachers: [{ userId: subTeacherId }],
					students: [{ userId: studentId }],
				};

				const context = new CourseBoardContext(data);
				const result = context.getUsersWithBoardRoles();

				expect(result).toHaveLength(3);
				expect(result[0].userId).toBe(teacherId);
				expect(result[0].roles).toEqual([BoardRoles.EDITOR, BoardRoles.ADMIN]);
				expect(result[1].userId).toBe(subTeacherId);
				expect(result[1].roles).toEqual([BoardRoles.EDITOR, BoardRoles.ADMIN]);
				expect(result[2].userId).toBe(studentId);
				expect(result[2].roles).toEqual([BoardRoles.READER]);
			});
		});
	});

	describe('getBoardConfiguration', () => {
		describe('when course has teachers', () => {
			it('should return isLocked as false', () => {
				const data: CourseBoardContextData = {
					teachers: [{ userId: new ObjectId().toHexString() }],
					substitutionTeachers: [],
					students: [],
				};
				const columnBoard = columnBoardFactory.build();

				const context = new CourseBoardContext(data);
				const result = context.getBoardConfiguration(columnBoard);

				expect(result.isLocked).toBe(false);
			});
		});

		describe('when course has no teachers', () => {
			it('should return isLocked as true', () => {
				const data: CourseBoardContextData = {
					teachers: [],
					substitutionTeachers: [],
					students: [],
				};
				const columnBoard = columnBoardFactory.build();

				const context = new CourseBoardContext(data);
				const result = context.getBoardConfiguration(columnBoard);

				expect(result.isLocked).toBe(true);
			});
		});

		it('should return canEditorsManageVideoconference as false', () => {
			const data: CourseBoardContextData = {
				teachers: [{ userId: new ObjectId().toHexString() }],
				substitutionTeachers: [],
				students: [],
			};
			const columnBoard = columnBoardFactory.build();

			const context = new CourseBoardContext(data);
			const result = context.getBoardConfiguration(columnBoard);

			expect(result.canEditorsManageVideoconference).toBe(false);
		});

		it('should return canReadersEdit as false', () => {
			const data: CourseBoardContextData = {
				teachers: [{ userId: new ObjectId().toHexString() }],
				substitutionTeachers: [],
				students: [],
			};
			const columnBoard = columnBoardFactory.build();

			const context = new CourseBoardContext(data);
			const result = context.getBoardConfiguration(columnBoard);

			expect(result.canReadersEdit).toBe(false);
		});

		it('should return canAdminsToggleReadersCanEdit as false', () => {
			const data: CourseBoardContextData = {
				teachers: [{ userId: new ObjectId().toHexString() }],
				substitutionTeachers: [],
				students: [],
			};
			const columnBoard = columnBoardFactory.build();

			const context = new CourseBoardContext(data);
			const result = context.getBoardConfiguration(columnBoard);

			expect(result.canAdminsToggleReadersCanEdit).toBe(false);
		});
	});
});
