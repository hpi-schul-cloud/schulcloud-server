// TODO Compare with client
export const passwordPattern = new RegExp(
	/^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-z])(?=.*[-_!<>§$%&/()=?\\;:,.#+*~'])\S.{6,253}\S$/
);
