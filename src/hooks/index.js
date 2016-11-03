'use strict';

// Add any common hooks you want to share across services in here.
//
// Below is an example of how a hook is written and exported. Please
// see http://docs.feathersjs.com/hooks/readme.html for more details
// on hooks.

exports.myHook = function (options) {
	return function (hook) {
		//console.log('My custom global hook ran. Feathers is awesome!');
	};
};

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
