const dev = {
  API_URL: "http://192.168.20.103:5000/api",
};

const prod = {
  API_URL: "https://api.edubus.com/api", // server khi deploy
};

export const config =
  process.env.NODE_ENV === "development" ? dev : prod;
