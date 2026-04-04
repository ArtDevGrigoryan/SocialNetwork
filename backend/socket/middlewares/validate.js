const validate = (schema) => {
  return function validateSchema(socket, data, next) {
    schema.parse(data);
    return next();
  };
};

module.exports = validate;
