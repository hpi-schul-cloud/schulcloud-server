import { Test } from '@nestjs/testing';
import { Permission, RoleName } from '@shared/domain/interface';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { schoolFactory } from '@src/modules/school/testing';
import { PermissionService } from './permission.service';

describe('PermissionService', () => {
	let service: PermissionService;

	beforeAll(async () => {
		await setupEntities();

		const module = await Test.createTestingModule({ providers: [PermissionService] }).compile();

		service = module.get(PermissionService);
	});

	describe('resolvePermissions', () => {
		describe('when the user is neither teacher nor student', () => {
			const setup = () => {
				const somePermission = 'somePermission' as Permission;
				const someRole = roleFactory.build({ name: 'someRole' as RoleName, permissions: [somePermission] });
				const someUser = userFactory.build({ roles: [someRole] });
				const school = schoolFactory.build();

				return { someUser, school, somePermission };
			};

			it('should return permissions from user', () => {
				const { someUser, school, somePermission } = setup();

				const permissions = service.resolvePermissions(someUser, school);

				expect(permissions).toEqual(new Set([somePermission]));
			});
		});

		describe('when the user is a student', () => {
			describe('when student role has LERNSTORE_VIEW permission by default', () => {
				const setupStudent = () => {
					const studentRole = roleFactory.build({ name: RoleName.STUDENT, permissions: [Permission.LERNSTORE_VIEW] });
					const student = userFactory.build({ roles: [studentRole] });

					return { student };
				};

				describe('when school permission for LERNSTORE_VIEW is true', () => {
					const setup = () => {
						const school = schoolFactory.build({ permissions: { student: { LERNSTORE_VIEW: true } } });
						const { student } = setupStudent();

						return { school, student };
					};

					it('should return permissions including LERNSTORE_VIEW', () => {
						const { student, school } = setup();

						const permissions = service.resolvePermissions(student, school);

						expect(permissions).toContain(Permission.LERNSTORE_VIEW);
					});
				});

				describe('when school permission for LERNSTORE_VIEW is false', () => {
					const setup = () => {
						const school = schoolFactory.build({ permissions: { student: { LERNSTORE_VIEW: false } } });
						const { student } = setupStudent();

						return { school, student };
					};

					it('should return permissions not including LERNSTORE_VIEW', () => {
						const { student, school } = setup();

						const permissions = service.resolvePermissions(student, school);

						expect(permissions).not.toContain(Permission.LERNSTORE_VIEW);
					});
				});

				describe('when school permission for LERNSTORE_VIEW is not set', () => {
					const setup = () => {
						const school = schoolFactory.build();
						const { student } = setupStudent();

						return { school, student };
					};

					it('should return permissions not including LERNSTORE_VIEW', () => {
						const { student, school } = setup();

						const permissions = service.resolvePermissions(student, school);

						expect(permissions).not.toContain(Permission.LERNSTORE_VIEW);
					});
				});
			});

			describe('when student role does not have LERNSTORE_VIEW permission by default', () => {
				const setupStudent = () => {
					const studentRole = roleFactory.build({ name: RoleName.STUDENT });
					const student = userFactory.build({ roles: [studentRole] });

					return { student };
				};

				describe('when school permission for LERNSTORE_VIEW is true', () => {
					const setup = () => {
						const school = schoolFactory.build({ permissions: { student: { LERNSTORE_VIEW: true } } });
						const { student } = setupStudent();

						return { school, student };
					};

					it('should return permissions including LERNSTORE_VIEW', () => {
						const { student, school } = setup();

						const permissions = service.resolvePermissions(student, school);

						expect(permissions).toContain(Permission.LERNSTORE_VIEW);
					});
				});

				describe('when school permission for LERNSTORE_VIEW is false', () => {
					const setup = () => {
						const school = schoolFactory.build({ permissions: { student: { LERNSTORE_VIEW: false } } });
						const { student } = setupStudent();

						return { school, student };
					};

					it('should return permissions not including LERNSTORE_VIEW', () => {
						const { student, school } = setup();

						const permissions = service.resolvePermissions(student, school);

						expect(permissions).not.toContain(Permission.LERNSTORE_VIEW);
					});
				});

				describe('when school permission for LERNSTORE_VIEW is not set', () => {
					const setup = () => {
						const school = schoolFactory.build();
						const { student } = setupStudent();

						return { school, student };
					};

					it('should return permissions not including LERNSTORE_VIEW', () => {
						const { student, school } = setup();

						const permissions = service.resolvePermissions(student, school);

						expect(permissions).not.toContain(Permission.LERNSTORE_VIEW);
					});
				});
			});
		});

		describe('when the user is a teacher', () => {
			// We could have the same distinction regarding default permissions here as above for students, but we leave it out for brevity.
			const setupTeacher = () => {
				const teacherRole = roleFactory.build({ name: RoleName.TEACHER });
				const teacher = userFactory.build({ roles: [teacherRole] });

				return { teacher };
			};

			describe('when school permission for STUDENT_LIST is true', () => {
				const setup = () => {
					const school = schoolFactory.build({ permissions: { teacher: { STUDENT_LIST: true } } });
					const { teacher } = setupTeacher();

					return { school, teacher };
				};

				it('should return permissions including STUDENT_LIST', () => {
					const { teacher, school } = setup();

					const permissions = service.resolvePermissions(teacher, school);

					expect(permissions).toContain(Permission.STUDENT_LIST);
				});
			});

			describe('when school permission for STUDENT_LIST is false', () => {
				const setup = () => {
					const school = schoolFactory.build({ permissions: { teacher: { STUDENT_LIST: false } } });
					const { teacher } = setupTeacher();

					return { school, teacher };
				};

				it('should return permissions not including STUDENT_LIST', () => {
					const { teacher, school } = setup();

					const permissions = service.resolvePermissions(teacher, school);

					expect(permissions).not.toContain(Permission.STUDENT_LIST);
				});
			});

			describe('when school permission for STUDENT_LIST is not set', () => {
				const setup = () => {
					const school = schoolFactory.build();
					const { teacher } = setupTeacher();

					return { school, teacher };
				};

				it('should return permissions not including STUDENT_LIST', () => {
					const { teacher, school } = setup();

					const permissions = service.resolvePermissions(teacher, school);

					expect(permissions).not.toContain(Permission.STUDENT_LIST);
				});
			});
		});
	});
});
