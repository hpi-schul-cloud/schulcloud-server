const sinon = require('sinon');
const { ObjectId } = require('mongoose').Types;
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const deleteUserData = require('./deleteUserData.uc');

const { classesRepo } = require('../repo/index');
const { ValidationError } = require('../../../errors');
const { toString: idToString } = require('../../../helper/compare').ObjectId;

const { expect } = chai;
chai.use(chaiAsPromised);

const USER_ID = new ObjectId();
const USER_ID_WITH_NO_CLASS = new ObjectId();
const CLASS_ID = new ObjectId();
const createTestGetClassForUserResult = (classId, student, teacher) => {
	if (!classId) {
		return [];
	}

	return [
		{
			_id: classId,
			student,
			teacher,
		},
	];
};

const initStubs = ({ classId, isStudent, isTeacher }) => {
	const getClassesStub = sinon.stub(classesRepo, 'getClassesForUser');
	getClassesStub.callsFake(() => []);
	getClassesStub.withArgs(USER_ID).returns(createTestGetClassForUserResult(classId, isStudent, isTeacher));

	const removeClassesStub = sinon.stub(classesRepo, 'removeUserFromClasses');
	removeClassesStub.withArgs(USER_ID).returns({ success: true, modifiedDocuments: 1 });

	return { getClassesStub, removeClassesStub };
};

describe('delete class user data usecase', () => {
	describe('delete class user data uc', () => {
		it('should return a function', async () => {
			const deleteUserDataFromClasses = deleteUserData.deleteUserData();
			expect(deleteUserDataFromClasses).to.be.an('Array');
			expect(deleteUserDataFromClasses.length).to.be.equal(1);
			expect(deleteUserDataFromClasses[0]).to.be.a('function');
		});

		it('should return a valid result (trashbin) object', async () => {
			const { getClassesStub, removeClassesStub } = initStubs({ classId: CLASS_ID, isStudent: true, isTeacher: true });

			const deleteUserDataFromClasses = deleteUserData.deleteUserData()[0];
			const result = await deleteUserDataFromClasses(USER_ID);
			getClassesStub.restore();
			removeClassesStub.restore();

			expect(result.complete).to.be.true;
			expect(result.trashBinData.data).to.be.an('object');
			expect(result.trashBinData.scope).to.be.equal('classes');
			const { data } = result.trashBinData;
			expect(data.classIds).to.be.an('object');
			expect(data.classIds.student.map(idToString), 'have the class id given as student').to.have.members([
				idToString(CLASS_ID),
			]);
			expect(data.classIds.teacher.map(idToString), 'have the class id given as teacher').to.have.members([
				idToString(CLASS_ID),
			]);
		});

		it('should return an empty result (trashbin) object, for user with no class assigned', async () => {
			const { getClassesStub, removeClassesStub } = initStubs({});

			const deleteUserDataFromClasses = deleteUserData.deleteUserData()[0];
			const result = await deleteUserDataFromClasses(USER_ID_WITH_NO_CLASS);
			getClassesStub.restore();
			removeClassesStub.restore();

			expect(result.complete).to.be.true;
			expect(result.trashBinData.data).to.be.an('object');
			expect(result.trashBinData.scope).to.be.equal('classes');
			expect(result.trashBinData.data).to.deep.equal({});
		});

		it('should throw an error if called with an invalid ObjectId', () => {
			const deleteUserDataFromClasses = deleteUserData.deleteUserData()[0];
			expect(deleteUserDataFromClasses('NOT_AN_ID')).to.eventually.throw(new ValidationError());
		});
	});
});
