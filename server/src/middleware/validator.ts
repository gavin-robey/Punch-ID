import { RequestHandler } from 'express';
import { sendErrorRes } from 'src/utils/helper';
import * as yup from 'yup';

const validate = (schema: yup.Schema): RequestHandler => {
    return async (req, res, next) => {
        try{
            await schema.validate({...req.body}, {strict: true, abortEarly: true})
            next();
        }catch(err){
            if(err instanceof yup.ValidationError){
                sendErrorRes(res, 422, err.message);
            }else{
                next(err);
            }
        }
    }
}

export default validate;