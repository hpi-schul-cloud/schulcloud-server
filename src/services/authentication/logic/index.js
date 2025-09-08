const extractTokenFromBearerHeader = (header) => header.replace('Bearer ', '');

module.exports = {
	extractTokenFromBearerHeader,
};
