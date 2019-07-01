const mailToLowerCase = (hook) => {
	if (hook.data) {
		if (hook.data.email) {
			hook.data.email = hook.data.email.toLowerCase();
		}
		if (hook.data.parent_email) {
			hook.data.parent_email = hook.data.parent_email.toLowerCase();
		}
		if (hook.data.student_email) {
			hook.data.student_email = hook.data.student_email.toLowerCase();
		}
	}
	return Promise.resolve(hook);
};


module.exports = {
	mailToLowerCase,
}