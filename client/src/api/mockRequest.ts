import { runAxiosAsync } from '@/api/runAxiosAsync';

// Stand-in for runAxiosAsync while endpoints don't exist yet. Resolves with the same
// { data, error } shape so swapping to the real request is a one-line change.
export const mockRequest = async <T>(data: T, delay = 500): ReturnType<typeof runAxiosAsync<T>> => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return { data, error: null };
};
