module.exports = {
	checkPasswordStrength: (password) => {
		// eslint-disable-next-line max-len
		const passwordPattern = new RegExp(
			"^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-z])(?=.*[\\-_!<>§$%&\\/()=?\\\\;:,.#+*~']).{8,255}$"
		);
		return passwordPattern.test(password);
	},
	passwordsMatch: (password, password2) => password === password2,
};
