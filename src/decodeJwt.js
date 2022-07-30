const decodeJwt = (jws) => {
  const components = jws.split(".");
  const header = JSON.parse(Buffer.from(components[0], "base64").toString());
  const payload = JSON.parse(Buffer.from(components[1], "base64").toString());
  return { header, payload };
};

module.exports = decodeJwt;
