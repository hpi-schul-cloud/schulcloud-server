const { requestUserRemoval } = require('../../../services/messengerSync/producer');

const deactivateUser = async (userId) => {
    return requestUserRemoval();
}

module.exports = {
	deactivateUser,
};

