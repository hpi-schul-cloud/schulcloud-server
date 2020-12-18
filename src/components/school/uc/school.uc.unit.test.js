const chai = require('chai');
const schoolUc = require('./school.uc');

const { expect } = chai;

describe('school.uc', () => {
	describe('checkPermissions', () => {
		it('should return true for valid permissions', () => {
			const schoolId = 'dummySchoolId123';
			const permissionToCheck = 'SCHOOL_EDIT';
			const user = {
				schoolId: schoolId.toString(),
				roles: [
					{
						permissions: [permissionToCheck.toString(), 'SOME_STUFF'],
					},
					{
						permissions: ['OTHER_PERMISSION', 'SOME_STUFF'],
					},
				],
			};
			expect(schoolUc.checkPermissions(schoolId, permissionToCheck, user)).to.be.true;
		});
		it('should fail for empty user permissions', () => {
			const schoolId = 'dummySchoolId123';
			const user = {
				schoolId: schoolId.toString(),
				roles: [
					{
						permissions: [],
					},
				],
			};
			const permissionToCheck = 'SCHOOL_EDIT';
			expect(schoolUc.checkPermissions(schoolId, permissionToCheck, user)).to.be.false;
		});
		it('should fail for empty user roles', () => {
			const schoolId = 'dummySchoolId123';
			const user = {
				schoolId: schoolId.toString(),
				roles: [],
			};
			const permissionToCheck = 'SCHOOL_EDIT';
			expect(schoolUc.checkPermissions(schoolId, permissionToCheck, user)).to.be.false;
        });
        it('should fail for missing permission', () => {
			const schoolId = 'dummySchoolId123';
			const permissionToCheck = 'SCHOOL_EDIT';
			const user = {
				schoolId: schoolId.toString(),
				roles: [
					{
						permissions: ['SOME_PERMISSION'],
					},
					{
						permissions: ['OTHER_PERMISSION', 'SOME_STUFF'],
					},
				],
			};
			expect(schoolUc.checkPermissions(schoolId, permissionToCheck, user)).to.be.false;
		});
		it('should fail for different schools', () => {
			const schoolId = 'dummySchoolId123';
			const permissionToCheck = 'SCHOOL_EDIT';
			const user = {
				schoolId: 'differentSchoolId234',
				roles: [
					{
						permissions: [permissionToCheck.toString(), 'SOME_STUFF'],
					},
					{
						permissions: ['OTHER_PERMISSION', 'SOME_STUFF'],
					},
				],
			};
			expect(schoolUc.checkPermissions(schoolId, permissionToCheck, user)).to.be.false;
		});
	});
});
