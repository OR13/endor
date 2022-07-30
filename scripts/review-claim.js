const fs = require("fs");
const jose = require("jose");
const did = require("@transmute/did-key.js");
const Ajv = require("ajv");
const endor = require("../src");

const ajv = new Ajv();

const schemas = {
  header: require("../docs/policy/schemas/header.json"),
  payload: require("../docs/policy/schemas/payload.json"),
  vc: require("../docs/policy/schemas/VerifiableCredential.json"),
};

const verify = async (jws) => {
  const { header, payload } = endor.decodeJwt(jws);

  if (!header.kid.startsWith(payload.iss)) {
    throw new Error("Issuer does not control signing key.");
  }

  const { didDocument } = await did.resolve(payload.iss, {
    accept: "application/did+json",
  });

  const publicKey = await jose.importJWK({
    ...didDocument.verificationMethod[0].publicKeyJwk,
    alg: header.alg,
  });

  try {
    const verification = await jose.compactVerify(jws, publicKey);
    const verifiedPayload = new TextDecoder().decode(verification.payload);
    return { header, payload: JSON.parse(verifiedPayload) };
  } catch (e) {
    return false;
  }
};

const isHeaderValid = (header) => {
  const validate = ajv.compile(schemas.header);
  const valid = validate(header);
  if (!valid) {
    console.warn(validate.errors);
  }
  return valid;
};

const isPayloadValid = (payload) => {
  const validate = ajv.compile(schemas.payload);
  const valid = validate(payload);
  if (!valid) {
    console.warn(validate.errors);
  }
  return valid;
};

const isValidVerifiableCredential = (vc) => {
  const validate = ajv.compile(schemas.vc);
  const valid = validate(vc);
  if (!valid) {
    console.warn(validate.errors);
  }
  return valid;
};

const validate = ({ header, payload }) => {
  return (
    isHeaderValid(header) &&
    isPayloadValid(payload) &&
    isValidVerifiableCredential(payload.vc)
  );
};

(async () => {
  console.log("🧙‍♂️ Reviewing claim...");
  let claim;
  try {
    claim = fs.readFileSync("./docs/inbox/claim.json").toString();
    claim = JSON.parse(claim);
  } catch (e) {
    console.log(
      "🔥 Claim parsing failed. Make sure your pull request includes a './docs/inbox/claim.json'"
    );
    process.exit(1);
  }
  const verified = await verify(claim.jwt);
  if (!verified) {
    console.log("🔥 Claim verification failed.");
    process.exit(1);
  }
  const valid = await validate(verified);
  if (!valid) {
    console.log("🔥 Claim validation failed.");
    process.exit(1);
  }
  console.log("🌱 Claim validation succeded.");
  process.exit(0);
})();
