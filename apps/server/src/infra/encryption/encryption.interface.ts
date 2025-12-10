export const DefaultEncryptionService = Symbol('DefaultEncryptionService');

export interface EncryptionService {
	encrypt(data: string): string;
	decrypt(data: string): string;
}
