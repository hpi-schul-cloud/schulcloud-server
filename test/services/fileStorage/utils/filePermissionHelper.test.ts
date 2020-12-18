import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { FileModel } from '../../../../src/services/fileStorage/model';
import {
	canCreate,
	canDelete,
	canRead,
	canWrite,
} from '../../../../src/services/fileStorage/utils/filePermissionHelper';
import { homeworkModel } from '../../../../src/services/homework/model';
import RoleModel from '../../../../src/services/role/model';
import { courseModel } from '../../../../src/services/user-group/model';
import { userModel } from '../../../../src/services/user/model';
import fixtures from '../fixtures';

const { expect } = chai;
chai.use(chaiAsPromised);

describe('filePermissionHelper', () => {
	describe('checkPermissions function should', () => {
		before((done) => {
			const promises = [
				FileModel.create(fixtures.files),
				userModel.create(fixtures.users),
				RoleModel.create(fixtures.roles),
				courseModel.create(fixtures.courses),
				homeworkModel.create(fixtures.homeworks),
			];

			Promise.all(promises)
				.then(() => done())
				.catch(() => done());
		});

		after((done) => {
			const promises = [
				...fixtures.files.map((_) => FileModel.findByIdAndRemove(_._id).exec()),
				...fixtures.users.map((_) => userModel.findByIdAndRemove(_._id).exec()),
				...fixtures.roles.map((_) => RoleModel.findByIdAndRemove(_._id).exec()),
				...fixtures.courses.map((_) => courseModel.findByIdAndRemove(_._id).exec()),
				...fixtures.homeworks.map((_) => homeworkModel.findByIdAndRemove(_._id).exec()),
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

			Promise.all(permissionPromises).then((result) => {
				expect(result).to.have.lengthOf(4);
				done();
			});
		});

		it('let read shared file', (done) => {
			canRead('0000d224816abba584714c8c', '5ca613c4c7f5120b8c5bef27').then((result) => {
				expect(result).to.be.true;
				done();
			});
		});

		it('let teacher read his homework file', async () => {
			expect(canRead(fixtures.users[2]._id, '5ca601745d629505e51252d8')).to.be.eventually.true;
		});

		it('let student read homework file', async () => {
			expect(canRead(fixtures.users[0]._id, '5ca601745d629505e51252d8')).to.be.eventually.true;
		});

		it('reject student from other course to read homework file', async () => {
			expect(canRead(fixtures.users[1]._id, '5ca601745d629505e51252d8')).to.be.rejected;
		});

		it('let read, write, create and delete course files for teacher', async () => {
			expect(canWrite('0000d224816abba584714c8e', '5ca613c4c7f5120b8c5bef28')).to.be.eventually.true;
			expect(canRead('0000d224816abba584714c8e', '5ca613c4c7f5120b8c5bef28')).to.be.eventually.true;
			expect(canCreate('0000d224816abba584714c8e', '5ca613c4c7f5120b8c5bef28')).to.be.eventually.true;
			expect(canDelete('0000d224816abba584714c8e', '5ca613c4c7f5120b8c5bef28')).to.be.eventually.true;
		});

		it('let read, write, create and delete course files members', async () => {
			expect(canWrite('0000d224816abba584714c8c', '5ca613c4c7f5120b8c5bef28')).to.be.eventually.true;
			expect(canRead('0000d224816abba584714c8c', '5ca613c4c7f5120b8c5bef28')).to.be.eventually.true;
			expect(canCreate('0000d224816abba584714c8c', '5ca613c4c7f5120b8c5bef28')).to.be.eventually.true;
			expect(canDelete('0000d224816abba584714c8c', '5ca613c4c7f5120b8c5bef28')).to.be.eventually.true;
		});

		it('reject read, write, create and delete course files for non course-member students', async () => {
			expect(canWrite('0000d224816abba584714c8d', '5ca613c4c7f5120b8c5bef28')).to.be.eventually.rejected;
			expect(canRead('0000d224816abba584714c8d', '5ca613c4c7f5120b8c5bef28')).to.be.eventually.rejected;
			expect(canCreate('0000d224816abba584714c8d', '5ca613c4c7f5120b8c5bef28')).to.be.eventually.rejected;
			expect(canDelete('0000d224816abba584714c8d', '5ca613c4c7f5120b8c5bef28')).to.be.eventually.rejected;
		});
	});
});
