const messengerRepo = require('../repo/messenger.repo');
const { trashBinResult } = require('../../helper/uc.helper');

const deactivateUser = async (userId) => {
    await messengerRepo.deactivateUser(userId);
    return trashBinResult({scope: 'messenger', data: {}, complete: true})
}

const deleteUserData = [deactivateUser];

module.exports = {
	deleteUserData,
};

