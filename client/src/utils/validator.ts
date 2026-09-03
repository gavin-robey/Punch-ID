import * as yup from "yup";

type ValidationResult<T> = {
    error?: string;
    values?: T
}

export const yupValidate = async<T extends object>(schema: yup.Schema, value: T): Promise<ValidationResult<T>> => {
    try {
        const data = await schema.validate(value);
        return { values: data };
    } catch (error) {
        if(error instanceof yup.ValidationError){
            return { error: error.message };
        }else{
            return {error: (error as any).message};
        }
    }
}