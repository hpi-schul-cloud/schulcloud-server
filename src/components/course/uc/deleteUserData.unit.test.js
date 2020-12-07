const sinon = require('sinon');
const { ObjectId } = require('mongoose').Types;
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const deleteUserDataUC = require('./deleteUserData.uc');

const { expect } = chai;
chai.use(chaiAsPromised);

describe('when removing user relations in courses', () => {
	describe('all the lessons', () => {
		it('should be addded to trashbindata', () => {
		});
	});
});
