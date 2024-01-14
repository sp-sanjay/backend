import { ApiError } from "../utils/ApiError.js";

export const validateRequest = (schema) => {
  return (req, res, next) => {
    let requestData = req.method === "GET" ? req.query : req.body;
    if (req.files) {
      requestData = {
        ...requestData,
        ...req.files,
      };
    }
    if (req.file) {
      requestData = {
        ...requestData,
        [req.file.fieldname] :req.file,
      };
    }
    schema
      .validateAsync(requestData)
      .then((validatedData) => {
        next();
      })
      .catch((error) => {
        res.status(400).json({
          status: "error",
          message: error.message,
          statusCode: 400,
          success: false,
        });
      });
  };
};
