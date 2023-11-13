export interface ErrorInterface extends Error {
	status?: number;
	message: string;
}
export interface RpcMessage<T> {
	message: T;
	error?: ErrorInterface;
}
