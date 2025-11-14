// taken from apps/server/src/modules/account/domain/do/password-pattern.ts
// as I dont want to import account module into registration module
export const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[a-z])(?=.*[-_!<>§$%&/()=?\\;:,.#+*~'])\S.{6,253}\S$/;
