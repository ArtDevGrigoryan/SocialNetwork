const validate = (schema) => {
  return async function validateSchema(socket, data, next) {
    console.log(data)
    schema.parse(data);
    return next();
  };
};

module.exports = validate;
