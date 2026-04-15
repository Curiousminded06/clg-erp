export function validate(schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!parsed.success) {
      return next({
        name: 'ZodError',
        issues: parsed.error.issues
      });
    }

    req.validated = parsed.data;
    return next();
  };
}
