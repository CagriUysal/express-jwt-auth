const config = {
  port: process.env.PORT || 3000,
  secrets: {
    jwt: process.env.JWT_SECRET,
  },
};

export default config;
