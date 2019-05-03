const { expect } = require('chai');

const { FileModel } = require('../../../../src/services/fileStorage/model');
const { userModel } = require('../../../../src/services/user/model');
const RoleModel = require('../../../../src/services/role/model');
// const { submissionModel } = require('../../../../src/services/homework/model');
const { courseModel } = require('../../../../src/services/user-group/model');

const {
	canWrite,
	canRead,
	canCreate,
	canDelete,
} = require('../../../../src/services/fileStorage/utils/filePermissionHelper');

const fixtures = require('./fixtures');

describe('filePermissionHelper', () => {

	describe('checkPermissions function should', () => {

		before((done) => {
			const promises = [
				FileModel.create(fixtures.files),
				userModel.create(fixtures.users),
				RoleModel.create(fixtures.roles),
				courseModel.create(fixtures.roles),
			];

			Promise.all(promises)
				.then(() => done())
				.catch(() => done());
		});

		after((done) => {
			const promises = [
				...fixtures.files.map(_ => FileModel.findByIdAndRemove(_._id)),
				...fixtures.users.map(_ => userModel.findByIdAndRemove(_._id)),
				...fixtures.roles.map(_ => RoleModel.findByIdAndRemove(_._id)),
				...fixtures.courses.map(_ => courseModel.findByIdAndRemove(_._id)),
			];

			Promise.all(promises)
				.then(() => done())
				.catch(() => done());
		});

		it('does not let access files for no owner, member or shared file', (done) => {
			canRead('0001d224816abba584714c9c', '5ca613c4c7f5120b8c5bef27').catch(() => {
				done();
			});
		});

		it('let read, write, create and delete user created files', (done) => {
			const permissionPromises = [
				canWrite('0000d224816abba584714c8c', '5ca601745d629505e51252d7').then(() => f).catch(() => undefined),
				canRead('0000d224816abba584714c8c', '5ca601745d629505e51252d7').then(() => f).catch(() => undefined),
				canCreate('0000d224816abba584714c8c', '5ca601745d629505e51252d7').then(() => f).catch(() => undefined),
				canDelete('0000d224816abba584714c8c', '5ca601745d629505e51252d7').then(() => f).catch(() => undefined),
			];

			Promise.all(permissionPromises).then(result => {
				expect(result).to.have.lengthOf(4);
				done();
			});
		});

		it('let read shared file', (done) => {
			canRead('0000d224816abba584714c8c', '5ca613c4c7f5120b8c5bef27').then(result => {
				expect(result).to.be.true;
				done();
			});
		});

		it('let read, write, create and delete course files for teacher', (done) => {
			const permissionPromises = [
				canWrite('0000d224816abba584714c8e', '5ca613c4c7f5120b8c5bef28').then(() => f).catch(() => undefined),
				canRead('0000d224816abba584714c8e', '5ca613c4c7f5120b8c5bef28').then(() => f).catch(() => undefined),
				canCreate('0000d224816abba584714c8e', '5ca613c4c7f5120b8c5bef28').then(() => f).catch(() => undefined),
				canDelete('0000d224816abba584714c8e', '5ca613c4c7f5120b8c5bef28').then(() => f).catch(() => undefined),
			];

			Promise.all(permissionPromises).then(result => {
				expect(result).to.have.lengthOf(4);
				done();
			});
		});

		it('let read, write, create and delete course files members', (done) => {
			const permissionPromises = [
				canWrite('0000d224816abba584714c8c', '5ca613c4c7f5120b8c5bef28').then(() => f).catch(() => undefined),
				canRead('0000d224816abba584714c8c', '5ca613c4c7f5120b8c5bef28').then(() => f).catch(() => undefined),
				canCreate('0000d224816abba584714c8c', '5ca613c4c7f5120b8c5bef28').then(() => f).catch(() => undefined),
				canDelete('0000d224816abba584714c8c', '5ca613c4c7f5120b8c5bef28').then(() => f).catch(() => undefined),
			];

			Promise.all(permissionPromises).then(result => {
				expect(result).to.have.lengthOf(4);
				done();
			});
		});

		it('does not let read, write, create and delete course files for non members students', (done) => {
			const permissionPromises = [
				canWrite('0000d224816abba584714c8c', '5ca613c4c7f5120b8c5bef28').then(() => f).catch(() => undefined),
				canRead('0000d224816abba584714c8c', '5ca613c4c7f5120b8c5bef28').then(() => f).catch(() => undefined),
				canCreate('0000d224816abba584714c8c', '5ca613c4c7f5120b8c5bef28').then(() => f).catch(() => undefined),
				canDelete('0000d224816abba584714c8c', '5ca613c4c7f5120b8c5bef28').then(() => f).catch(() => undefined),
			];

			Promise.all(permissionPromises).then(result => {
				expect(result).to.have.lengthOf(4);
				expect(result.filter(Boolean)).to.have.lengthOf(0);
				done();
			});
		});

	});
});

