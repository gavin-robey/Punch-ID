import * as yup from "yup";
import { ContentType, Visibility } from "src/models/punchTask";

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
        }),
    description: yup
        .string(),
    contentType: yup
        .string()
        .oneOf(Object.values(ContentType), "Invalid content type")
        .required("Content type is required"),
    visibility: yup
        .string()
        .oneOf(Object.values(Visibility), "Invalid visibility"),
    notes: yup
        .string()
        .when("contentType", {
            is: ContentType.NOTES,
            then: (schema) => schema.required("Notes are required")
        })
})
