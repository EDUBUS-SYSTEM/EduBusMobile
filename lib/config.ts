const dev = {
  API_URL: "http://192.168.1.5:5223/api", // local dev
};

const prod = {
  API_URL: "https://api.edubus.com/api", // server khi deploy
};

export const config =
  process.env.NODE_ENV === "development" ? dev : prod;
