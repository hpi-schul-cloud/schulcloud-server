import { AxiosError } from 'axios';

export function isAxiosError(error: unknown): error is AxiosError {
	return !!(error && typeof error === 'object' && 'isAxiosError' in error);
}
