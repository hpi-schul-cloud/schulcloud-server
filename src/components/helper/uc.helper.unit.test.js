/* eslint-disable prettier/prettier */
const chai = require('chai');
const { checkPermissions } = require('./uc.helper');

const { expect } = chai;

describe('uc.helper', () => {
	describe('checkPermissions', () => {
		describe('single needed permission', () => {
			it('should return true for valid permission', () => {
				const schoolId = 'dummySchoolId123';
				const permissionToCheck = ['SCHOOL_EDIT'];
				const user = {
					schoolId,
					roles: [
						{
							permissions: [...permissionToCheck, 'SOME_STUFF'],
						},
						{
							permissions: ['OTHER_PERMISSION', 'SOME_STUFF'],
						},
					],
				};
				expect(() => checkPermissions(user, schoolId, permissionToCheck)).to.not.throw;
			});
			it('should fail for empty user permissions', () => {
				const schoolId = 'dummySchoolId123';
				const user = {
					schoolId,
					roles: [
						{
							permissions: [],
						},
					],
				};
				const permissionToCheck = ['SCHOOL_EDIT'];
				expect(() => checkPermissions(user, schoolId, permissionToCheck)).to.throw(
					`You don't have permissions to perform this action`
				);
			});
			it('should fail for empty user roles', () => {
				const schoolId = 'dummySchoolId123';
				const user = {
					schoolId,
					roles: [],
				};
				const permissionToCheck = ['SCHOOL_EDIT'];
				expect(() => checkPermissions(user, schoolId, permissionToCheck)).to.throw(
					`You don't have permissions to perform this action`
				);
			});
			it('should fail for missing permission', () => {
				const schoolId = 'dummySchoolId123';
				const permissionToCheck = ['SCHOOL_EDIT'];
				const user = {
					schoolId,
					roles: [
						{
							permissions: ['SOME_PERMISSION'],
						},
						{
							permissions: ['OTHER_PERMISSION', 'SOME_STUFF'],
						},
					],
				};
				expect(() => checkPermissions(user, schoolId, permissionToCheck)).to.throw(
					`You don't have permissions to perform this action`
				);
			});
			it('should fail for different schools', () => {
				const schoolId = 'dummySchoolId123';
				const permissionToCheck = ['SCHOOL_EDIT'];
				const user = {
					schoolId: 'differentSchoolId234',
					roles: [
						{
							permissions: [...permissionToCheck, 'SOME_STUFF'],
						},
						{
							permissions: ['OTHER_PERMISSION', 'SOME_STUFF'],
						},
					],
				};
				expect(() => checkPermissions(user, schoolId, permissionToCheck)).to.throw(
					`You don't have permissions to perform this action`
				);
			});
		});
	});
	describe('multiple needed permissions', () => {
		it('should fail on invalid permission operator', () => {
			const schoolId = 'dummySchoolId123';
			const permissionToCheck = ['SCHOOL_EDIT'];
			const user = {
				schoolId: 'differentSchoolId234',
				roles: [
					{
						permissions: [...permissionToCheck, 'SOME_STUFF'],
					},
					{
						permissions: ['OTHER_PERMISSION', 'SOME_STUFF'],
					},
				],
			};
			expect(() => checkPermissions(user, schoolId, permissionToCheck, 'XOR')).to.throw(
				`ASSERTION_ERROR`
			);
		});
		it('should return true for valid multiple need permissions in one role', () => {
			const schoolId = 'dummySchoolId123';
			const permissionToCheck = ['SCHOOL_EDIT', 'USER_EDIT'];
			const user = {
				schoolId,
				roles: [
					{
						permissions: [...permissionToCheck, 'SOME_STUFF'],
					},
					{
						permissions: ['OTHER_PERMISSION', 'SOME_STUFF'],
					},
				],
			};
			expect(() => checkPermissions(user, schoolId, permissionToCheck, 'AND')).to.not.throw;
		});
		it('should return true for valid multiple need permissions distributed over multiple roles', () => {
			const schoolId = 'dummySchoolId123';
			const permissionToCheck = ['SCHOOL_EDIT', 'USER_EDIT'];
			const user = {
				schoolId,
				roles: [
					{
						permissions: [permissionToCheck[0], 'SOME_STUFF'],
					},
					{
						permissions: [permissionToCheck[1], 'OTHER_PERMISSION', 'SOME_STUFF'],
					},
				],
			};
			expect(() => checkPermissions(user, schoolId, permissionToCheck)).to.not.throw;
		});

		it('should fail one of multiple need permissions missing', () => {
			const schoolId = 'dummySchoolId123';
			const permissionToCheck = ['SCHOOL_EDIT', 'USER_EDIT'];
			const user = {
				schoolId,
				roles: [
					{
						permissions: [permissionToCheck[0], 'SOME_STUFF'],
					},
					{
						permissions: ['OTHER_PERMISSION', 'SOME_STUFF'],
					},
				],
			};
			expect(() => checkPermissions(user, schoolId, permissionToCheck)).to.not.throw;
		});

		it('should return true for valid one of multiple permissions needed', () => {
			const schoolId = 'dummySchoolId123';
			const permissionToCheck = ['SCHOOL_EDIT', 'USER_EDIT'];
			const user = {
				schoolId,
				roles: [
					{
						permissions: [permissionToCheck[0], 'SOME_STUFF'],
					},
					{
						permissions: ['OTHER_PERMISSION', 'SOME_STUFF'],
					},
				],
			};
			expect(() => checkPermissions(user, schoolId, permissionToCheck, 'OR')).to.not.throw;
		});
	});
});
