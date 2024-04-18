import { FeathersServiceProvider } from '@infra/feathers';
import { ObjectId } from '@mikro-orm/mongodb';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { Test, TestingModule } from '@nestjs/testing';

import { NewsTargetModel } from '@shared/domain/types';
import { FeathersAuthProvider } from './feathers-auth.provider';

describe('FeathersAuthProvider', () => {
	let authProvider: FeathersAuthProvider;
	let module: TestingModule;
	const userId = new ObjectId().toHexString();
	const schoolId = new ObjectId().toHexString();
	const courseId = new ObjectId().toHexString();
	const teamId = new ObjectId().toHexString();
	const schoolPermissions = ['SCHOOL_CREATE', 'SCHOOL_EDIT', 'SCHOOL_VIEW', 'SCHOOL_DELETE'];
	const coursePermissions = ['COURSE_VIEW', 'COURSE_CREATE', 'COURSE_EDIT', 'COURSE_DELETE'];
	const teamPermissions = ['TEAM_CREATE', 'TEAM_EDIT', 'TEAM_VIEW', 'TEAM_DELETE'];
	const defaultUser = {
		userId,
		schoolId,
		permissions: schoolPermissions,
	};
	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				FeathersAuthProvider,
				{
					provide: FeathersServiceProvider,
					useValue: {
						getService(name: string) {
							if (name === 'users') {
								return {
									get(user) {
										const foundUser = user === userId ? defaultUser : null;
										return Promise.resolve(foundUser);
									},
									find(user) {
										const foundUser = user === userId ? defaultUser : null;
										return Promise.resolve(foundUser);
									},
								};
							}
							if (name === 'coursesUserPermissions/:scopeId') {
								return {
									get() {
										return Promise.resolve(coursePermissions);
									},
								};
							}
							if (name === 'teams/:scopeId/userPermissions/') {
								return {
									get() {
										return Promise.resolve(teamPermissions);
									},
								};
							}
							if (name === 'schools/:scopeId/userPermissions/') {
								return {
									get() {
										return Promise.resolve(schoolPermissions);
									},
								};
							}
							if (name === '/users/:scopeId/courses') {
								return {
									find() {
										const defaultCourses = [
											{
												_id: courseId,
											},
										];
										return Promise.resolve(defaultCourses);
									},
								};
							}
							if (name === '/users/:scopeId/teams') {
								return {
									find() {
										const defaultTeams = [
											{
												_id: teamId,
											},
										];
										return Promise.resolve(defaultTeams);
									},
								};
							}
							return {};
						},
					},
				},
			],
		}).compile();

		authProvider = await module.resolve<FeathersAuthProvider>(FeathersAuthProvider);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(authProvider).toBeDefined();
	});

	describe('getUserSchoolPermissions', () => {
		it('should return user school permissions', async () => {
			const userSchoolPermissions = await authProvider.getUserSchoolPermissions(userId, schoolId);
			expect(userSchoolPermissions).toBe(schoolPermissions);
		});

		it('should throw NotFound exception if user could not be found', async () => {
			const anotherUserId = new ObjectId().toHexString();
			await expect(authProvider.getUserSchoolPermissions(anotherUserId, schoolId)).rejects.toThrow(NotFoundException);
		});

		it('should return empty permissions if user is not from the same school', async () => {
			const anotherSchool = new ObjectId().toHexString();
			const userSchoolPermissions = await authProvider.getUserSchoolPermissions(userId, anotherSchool);
			expect(userSchoolPermissions).toStrictEqual([]);
		});
	});

	describe('getUserTargetPermissions', () => {
		it('should return user course permissions', async () => {
			const userTargetPermissions = await authProvider.getUserTargetPermissions(
				userId,
				NewsTargetModel.Course,
				courseId
			);
			expect(userTargetPermissions).toBe(coursePermissions);
		});

		it('should return user team permissions', async () => {
			const userTargetPermissions = await authProvider.getUserTargetPermissions(userId, NewsTargetModel.Team, teamId);
			expect(userTargetPermissions).toBe(teamPermissions);
		});

		it('should return user school permissions', async () => {
			const userTargetPermissions = await authProvider.getUserTargetPermissions(userId, NewsTargetModel.School, teamId);
			expect(userTargetPermissions).toBe(schoolPermissions);
		});
	});

	describe('getPermittedSchools', () => {
		it('should return permitted schools', async () => {
			const permittedSchools = await authProvider.getPermittedSchools(userId);
			expect(permittedSchools).toStrictEqual([defaultUser.schoolId]);
		});
	});

	describe('getPermittedTargets', () => {
		it('should return permitted courses', async () => {
			const permittedCourses = await authProvider.getPermittedTargets(
				userId,
				NewsTargetModel.Course,
				coursePermissions
			);
			expect(permittedCourses).toStrictEqual([courseId]);
		});

		it('should return permitted teams', async () => {
			const permittedTeams = await authProvider.getPermittedTargets(userId, NewsTargetModel.Team, teamPermissions);
			expect(permittedTeams).toStrictEqual([teamId]);
		});
	});
});
