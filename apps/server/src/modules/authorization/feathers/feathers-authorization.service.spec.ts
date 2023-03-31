import { ObjectId } from '@mikro-orm/mongodb';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId, NewsTargetModel } from '@shared/domain';
import { FeathersAuthProvider } from './feathers-auth.provider';
import { FeathersAuthorizationService } from './feathers-authorization.service';

describe('FeatherAuthorizationService', () => {
	let module: TestingModule;
	let service: FeathersAuthorizationService;
	let authProvider: FeathersAuthProvider;
	const userId = new ObjectId().toHexString();
	const schoolId = new ObjectId().toHexString();
	const schoolPermissions = ['SCHOOL_CREATE', 'SCHOOL_EDIT', 'SCHOOL_VIEW', 'SCHOOL_DELETE'];
	const coursePermissions = ['COURSE_VIEW', 'COURSE_CREATE', 'COURSE_EDIT', 'COURSE_DELETE'];
	const teamPermissions = ['TEAM_CREATE', 'TEAM_EDIT', 'TEAM_VIEW', 'TEAM_DELETE'];

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				FeathersAuthorizationService,
				{
					provide: FeathersAuthProvider,
					useValue: {
						getUserSchoolPermissions() {
							return schoolPermissions;
						},
						getUserTargetPermissions(user: EntityId, targetModel: NewsTargetModel) {
							return targetModel === NewsTargetModel.Course ? coursePermissions : teamPermissions;
						},
						getPermittedSchools() {
							return [];
						},
						getPermittedTargets() {
							return [];
						},
					},
				},
			],
		}).compile();

		service = module.get(FeathersAuthorizationService);
		authProvider = module.get(FeathersAuthProvider);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('getEntityPermissions', () => {
		it('should call auth provider for school with correct params', async () => {
			const getUserSchoolPermissionsSpy = jest.spyOn(authProvider, 'getUserSchoolPermissions');
			await service.getEntityPermissions(userId, NewsTargetModel.School, schoolId);
			const expectedParams = [userId, schoolId];
			expect(getUserSchoolPermissionsSpy).toHaveBeenCalledWith(...expectedParams);
		});

		it('should call auth provider for course with correct params', async () => {
			const courseId = new ObjectId().toHexString();
			const getUserTargetPermissionsSpy = jest.spyOn(authProvider, 'getUserTargetPermissions');
			await service.getEntityPermissions(userId, NewsTargetModel.Course, courseId);
			const expectedParams = [userId, NewsTargetModel.Course, courseId];
			expect(getUserTargetPermissionsSpy).toHaveBeenCalledWith(...expectedParams);
		});

		it('should call auth provider for team with correct params', async () => {
			const teamId = new ObjectId().toHexString();
			const getUserTargetPermissionsSpy = jest.spyOn(authProvider, 'getUserTargetPermissions');
			await service.getEntityPermissions(userId, NewsTargetModel.Team, teamId);
			const expectedParams = [userId, NewsTargetModel.Team, teamId];
			expect(getUserTargetPermissionsSpy).toHaveBeenCalledWith(...expectedParams);
		});
	});

	describe('checkEntityPermissions', () => {
		it('should check course permissions', async () => {
			const courseId = new ObjectId().toHexString();
			await service.checkEntityPermissions(userId, NewsTargetModel.Course, courseId, coursePermissions);
		});

		it('should throw UnauthorizedException if permissions are not sufficient', async () => {
			const courseId = new ObjectId().toHexString();
			await expect(
				service.checkEntityPermissions(userId, NewsTargetModel.Course, courseId, teamPermissions)
			).rejects.toThrow(UnauthorizedException);
		});

		it('should fail when there is not at least one permission given', async () => {
			const courseId = new ObjectId().toHexString();

			await expect(service.checkEntityPermissions(userId, NewsTargetModel.Course, courseId, [])).rejects.toThrow(
				UnauthorizedException
			);
			await expect(
				service.checkEntityPermissions(userId, NewsTargetModel.Course, courseId, undefined as unknown as string[])
			).rejects.toThrow(UnauthorizedException);
		});
	});

	describe('getPermittedEntities', () => {
		it('should call auth provider for school with correct params', async () => {
			const getUserSchoolPermissionsSpy = jest.spyOn(authProvider, 'getPermittedSchools');
			await service.getPermittedEntities(userId, NewsTargetModel.School, schoolPermissions);
			const expectedParams = [userId];
			expect(getUserSchoolPermissionsSpy).toHaveBeenCalledWith(...expectedParams);
		});

		it('should call auth provider for course with correct params', async () => {
			const getPermittedTargetsSpy = jest.spyOn(authProvider, 'getPermittedTargets');
			const permissions = coursePermissions;
			await service.getPermittedEntities(userId, NewsTargetModel.Course, permissions);
			const expectedParams = [userId, NewsTargetModel.Course, permissions];
			expect(getPermittedTargetsSpy).toHaveBeenCalledWith(...expectedParams);
		});

		it('should call auth provider for team with correct params', async () => {
			const permissions = teamPermissions;
			const getPermittedTargetsSpy = jest.spyOn(authProvider, 'getPermittedTargets');
			await service.getPermittedEntities(userId, NewsTargetModel.Team, permissions);
			const expectedParams = [userId, NewsTargetModel.Team, permissions];
			expect(getPermittedTargetsSpy).toHaveBeenCalledWith(...expectedParams);
		});
	});
});
