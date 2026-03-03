const { ZodError } = require("zod");

module.exports = function validate(params) {
  const validationSources = ["body", "query", "params"];
  const schemas = params[0];
  const options = params[1] ?? { defaults: true };
  return function (req, res, next) {
    try {
      req.validated = req.validated || { body: {}, query: {}, params: {} };
      validationSources.forEach((source) => {
        const schema = schemas[source];
        if (!schema || !req.validated) return;

        if (options?.defaults) {
          req.validated[source] = schema.parse(req[source]);
        } else {
          schema.parse(req[source]);
        }
      });
      if (options.withUser) {
        req.validated.user = req.user || null;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return options?.onError?.(err, req, res, next) || next(err);
      }
      next(err);
    }
  };
};
