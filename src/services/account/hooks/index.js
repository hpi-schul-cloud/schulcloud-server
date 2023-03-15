const trimPassword = (hook) => {
	if (hook.data.password) {
		hook.data.password = hook.data.password.trim();
	}
	if (hook.data.password_verification) {
		hook.data.password_verification = hook.data.password_verification.trim();
	}

	return hook;
};

module.exports = {
	trimPassword,
};
