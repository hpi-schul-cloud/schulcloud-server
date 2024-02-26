// TODO: maybe place this in the domain, so it can be used in the service as well.

export const passwordPattern = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-z])(?=.*[-_!<>§$%&/()=?\\;:,.#+*~'])\S.{6,253}\S$/;
