export const DefaultEncryptionService = Symbol('DefaultEncryptionService');
export const LdapEncryptionService = Symbol('LdapEncryptionService');

export interface IEncryptionService {
	encrypt(data: string): string;
	decrypt(data: string): string;
}
