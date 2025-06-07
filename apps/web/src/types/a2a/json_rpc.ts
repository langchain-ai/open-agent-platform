export interface JSONRPCRequest { jsonrpc: "2.0"; method: string; params?: any; id?: string | number | null; }
export interface JSONRPCError { code: number; message: string; data?: any; }
export interface JSONRPCResponseBase { jsonrpc: "2.0"; id: string | number | null; }
export interface JSONRPCSuccessResponse extends JSONRPCResponseBase { result: any; }
export interface JSONRPCErrorResponse extends JSONRPCResponseBase { error: JSONRPCError; }
export type JSONRPCResponse = JSONRPCSuccessResponse | JSONRPCErrorResponse;
