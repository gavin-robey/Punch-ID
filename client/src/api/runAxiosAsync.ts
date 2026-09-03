import { AxiosError, AxiosResponse } from "axios";

type SuccessResponse<T> = {
    data: T
    error: null
}

type ErrorResponse<E> = {
    data: null
    error: E
}

export const runAxiosAsync = async<T>(promise: Promise<AxiosResponse<T>>): Promise<SuccessResponse<T> | ErrorResponse<string>> => {
    try {
        const response = await promise
        return {data: response.data, error: null};
    } catch (error) {
        if(error instanceof AxiosError){
            const response = error.response;
            if(response){
                return {data: null, error: response.data.message}
            }
        }

        return {data: null, error: (error as any).message}
    }
}