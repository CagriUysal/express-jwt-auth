const config = {
  port: Number(process.env.PORT) || 3000,
  secrets: {
    jwt: process.env.JWT_SECRET || "mybelovedsecrect",
  },
};

export default config;
