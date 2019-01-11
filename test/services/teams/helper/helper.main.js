const isPromise = (expectedPromise) => {
	if(! typeof expectedPromise === 'function')
		return false;
	if(!typeof expectedPromise === 'function')
		return false;
	return true;
};

module.exports = {
	isPromise,
};