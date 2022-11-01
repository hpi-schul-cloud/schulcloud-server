export interface IError extends Error {
	status?: number;
	message: never;
}
export interface RpcMessage<T> {
	message: T;
	error?: IError;
}
