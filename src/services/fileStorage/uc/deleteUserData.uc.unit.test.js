const { expect } = require('chai');
const rewire = require('rewire');

const deleteUserDataUcRewire = rewire('./deleteUserData.uc');
const { deleteUserData } = require('./deleteUserData.uc');

describe('deletedUserData.uc.unit', () => {
	let findSharedFilesWithUserId;

	before(() => {
		// eslint-disable-next-line no-underscore-dangle
		findSharedFilesWithUserId = deleteUserDataUcRewire.__get__('findSharedFilesWithUserId');
	});

	it('deleteUserData handle errors', () => {

	});

	it('deleteUserData return fulfilled context', () => {

	});
});
