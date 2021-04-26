const messengerRepo = require('../repo/messenger.repo');
const { trashBinResult } = require('../../helper/uc.helper');
const { facadeLocator } = require('../../../utils/facadeLocator');

const deactivateUser = async (userId) => {
	// ToDo: facade call is not needed once the context is available and the user is already stored there.
	const userFacade = facadeLocator.facade('/users/v2');
	const schoolId = await userFacade.getSchoolIdOfUser(userId);

    await messengerRepo.deactivateUser({_id: userId, schoolId});
    return trashBinResult({scope: 'messenger', data: {}, complete: true})
}

const deleteUserData = [deactivateUser];

module.exports = {
	deleteUserData,
};

