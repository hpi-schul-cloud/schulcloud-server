export abstract class AbstractOauthFetchImportUserStrategy<T, U> {
	public abstract getData(params: U): Promise<T>;
}
