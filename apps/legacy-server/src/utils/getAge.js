module.exports = (dateString) => {
	if (dateString === undefined) {
		return undefined;
	}
	const today = new Date();
	const birthDate = new Date(dateString);
	let age = today.getFullYear() - birthDate.getFullYear();
	const m = today.getMonth() - birthDate.getMonth();
	if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
		age -= 1;
	}
	return age;
};
