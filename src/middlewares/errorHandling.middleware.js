import { ApiError } from "../utils/ApiError.js";
const handleApiError = (err, req, res, next) => {
  if (err instanceof ApiError) {
    const errorResponse = {
      status: "error",
      message: err.message,
      statusCode: err?.errors?.statusCode ?? err.statusCode,
      success: err.success
    };

    console.error(err);

    res
      .status(err.statusCode)
      .json(errorResponse);
  } else {
    next(err);
  }
};

export { handleApiError };
