import { MetaData } from '../types';

export interface UrlHandler {
	doesUrlMatch(url: string): boolean;
	getMetaData(url: string): Promise<MetaData | undefined>;
}
