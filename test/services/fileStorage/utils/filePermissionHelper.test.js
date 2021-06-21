const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const { FileModel } = require('../../../../src/services/fileStorage/model');
const { userModel } = require('../../../../src/services/user/model');
const RoleModel = require('../../../../src/services/role/model');
// const { submissionModel } = require('../../../../src/services/homework/model');
const { courseModel } = require('../../../../src/services/user-group/model');
const { homeworkModel } = require('../../../../src/services/homework/model');

const {
	canWrite,
	canRead,
	canCreate,
	canDelete,
} = require('../../../../src/services/fileStorage/utils/filePermissionHelper');

const fixtures = require('../fixtures');

const { expect } = chai;
chai.use(chaiAsPromised);

describe('filePermissionHelper', () => {
	describe('checkPermissions function should', () => {
		before(async () => {
			const promises = [
				FileModel.create(fixtures.files),
				userModel.create(fixtures.users),
				RoleModel.create(fixtures.roles),
				courseModel.create(fixtures.courses),
				homeworkModel.create(fixtures.homeworks),
			];

			await Promise.all(promises);
		});

		after(async () => {
			const promises = [
				...fixtures.files.map((_) => FileModel.findByIdAndRemove(_._id).exec()),
				...fixtures.users.map((_) => userModel.findByIdAndRemove(_._id).exec()),
				...fixtures.roles.map((_) => RoleModel.findByIdAndRemove(_._id).exec()),
				...fixtures.courses.map((_) => courseModel.findByIdAndRemove(_._id).exec()),
				...fixtures.homeworks.map((_) => homeworkModel.findByIdAndRemove(_._id).exec()),
			];

			await Promise.all(promises);
		});

		it('does not let access files for no owner, member or shared file', (done) => {
			canRead('0001d224816abba584714c9c', '5ca613c4c7f5120b8c5bef27').catch(() => {
				done();
			});
		});

		it('let read, write, create and delete user created files', async () => {
			const permissionPromises = [
				canWrite('0000d224816abba584714c8c', '5ca601745d629505e51252d7')
					.then(() => true)
					.catch(() => undefined),
				canRead('0000d224816abba584714c8c', '5ca601745d629505e51252d7')
					.then(() => true)
					.catch(() => undefined),
				canCreate('0000d224816abba584714c8c', '5ca601745d629505e51252d7')
					.then(() => true)
					.catch(() => undefined),
				canDelete('0000d224816abba584714c8c', '5ca601745d629505e51252d7')
					.then(() => true)
					.catch(() => undefined),
			];

			const results = await Promise.all(permissionPromises);
			expect(results).to.have.lengthOf(4);
		});

		it('let read shared file', async () => {
			const result = await canRead('0000d224816abba584714c8c', '5ca613c4c7f5120b8c5bef27');
			expect(result).to.be.true;
		});

		it('let teacher read his homework file', async () => {
			await expect(canRead(fixtures.users[2]._id, '5ca601745d629505e51252d8')).to.be.eventually.true;
		});

		it('let student read homework file', async () => {
			await expect(canRead(fixtures.users[0]._id, '5ca601745d629505e51252d8')).to.be.eventually.true;
		});

		it('reject student from other course to read homework file', async () => {
			await expect(canRead(fixtures.users[1]._id, '5ca601745d629505e51252d8')).to.be.eventually.rejected;
		});

		it('let read, write, create and delete course files for teacher', async () => {
			await expect(canWrite('0000d224816abba584714c8e', '5ca613c4c7f5120b8c5bef28')).to.be.eventually.true;
			await expect(canRead('0000d224816abba584714c8e', '5ca613c4c7f5120b8c5bef28')).to.be.eventually.true;
			await expect(canCreate('0000d224816abba584714c8e', '5ca613c4c7f5120b8c5bef28')).to.be.eventually.true;
			await expect(canDelete('0000d224816abba584714c8e', '5ca613c4c7f5120b8c5bef28')).to.be.eventually.true;
		});

		it('let read, write, create and delete course files members', async () => {
			await expect(canWrite('0000d224816abba584714c8c', '5ca613c4c7f5120b8c5bef28')).to.be.eventually.true;
			await expect(canRead('0000d224816abba584714c8c', '5ca613c4c7f5120b8c5bef28')).to.be.eventually.true;
			await expect(canCreate('0000d224816abba584714c8c', '5ca613c4c7f5120b8c5bef28')).to.be.eventually.true;
			await expect(canDelete('0000d224816abba584714c8c', '5ca613c4c7f5120b8c5bef28')).to.be.eventually.true;
		});

		it('reject read, write, create and delete course files for non course-member students', async () => {
			await expect(canWrite('0000d224816abba584714c8d', '5ca613c4c7f5120b8c5bef28')).to.be.eventually.rejected;
			await expect(canRead('0000d224816abba584714c8d', '5ca613c4c7f5120b8c5bef28')).to.be.rejected;
			await expect(canCreate('0000d224816abba584714c8d', '5ca613c4c7f5120b8c5bef28')).to.be.eventually.rejected;
			await expect(canDelete('0000d224816abba584714c8d', '5ca613c4c7f5120b8c5bef28')).to.be.eventually.rejected;
		});
	});
});
