const { hooks } = require('feathers-authentication');

// don't require authentication for internal requests
exports.ifNotLocal = function(hookForRemoteRequests) {
	//const hashPassword = hooks.hashPassword(options);
	//const secondHook = options.function;

	return function(hook) {
		if(typeof(hook.params.provider) != 'undefined') {	// meaning it's not a local call
			// Call the specified hook
			return hookForRemoteRequests.call(this, hook);
		}
	};
};
