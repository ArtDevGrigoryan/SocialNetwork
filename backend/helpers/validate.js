module.exports = (schema, handler) => {
  return async (socket, data = {}, cb = () => {}) => {
    try {
      const parsed = schema ? schema.parse(data) : data;

      const result = await handler(socket, parsed);

      cb({ ok: true, data: result });
    } catch (err) {
      cb({
        ok: false,
        error: err.errors || err.message,
      });
    }
  };
};
