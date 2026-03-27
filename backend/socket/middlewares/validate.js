const validate = (schema) => {
  return async function validateSchema(socket, data, next) {console.log("okk ->", data)
    schema.parse(data);
    return next();
  };
};

module.exports = validate;
