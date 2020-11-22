export const SERVER_PREFIX = __SERVER__
  ? `http://localhost:${process.env.PORT || DEFAULT_PORT}/`
  : '/'
