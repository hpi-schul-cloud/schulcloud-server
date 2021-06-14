const { requestUserRemoval } = require('../../../services/messengerSync/producer');

const deactivateUser = (user) => requestUserRemoval(user);

module.exports = {
	deactivateUser,
};
