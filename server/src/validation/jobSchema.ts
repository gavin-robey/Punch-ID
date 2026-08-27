import * as yup from "yup";

export const newJobSchema = yup.object({
    name: yup
        .string()
        .required("Name is required")
});

export const newTaskSchema = yup.object({
    id: yup
        .string()
        .required("Job Id is missing"),
    name: yup
        .string()
        .required("Job name is required"),
    dateDue: yup
        .string()
        .required('date is required')
        .matches(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date format (YYYY-MM-DD)')
        .test('is-valid-date', 'Must be a valid date format', (value) => {
            if (!value) return false;
            const date = new Date(value);
            return !isNaN(date.getTime());
        })
})