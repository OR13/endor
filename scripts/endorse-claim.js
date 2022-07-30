const fs = require("fs");

const { v4: uuidv4 } = require("uuid");
// const did = require("@transmute/did-key.js");
// const crypto = require("crypto");
const { verifiable } = require("@transmute/vc.js");
const {
  JsonWebSignature,
  JsonWebKey,
} = require("@transmute/json-web-signature");
const endor = require("../src");

// normally you would pull this from environment secrets
// or use a github action with a github secret for the endorsement signin key.
// for demonstration purposes we just hard code the private key here.
const getEndorsement = async (endorsementObject) => {
  // const { keys } = await did.ed25519.generate({
  //   secureRandom: () => {
  //     return crypto.randomBytes(32);
  //   },
  // });
  // console.log(keys);
  const k = {
    id: "did:key:z6Mkme1qqoZUua9KoWHKqBwUCfiWYLoJP3KJQ3epdg56nWup#z6Mkme1qqoZUua9KoWHKqBwUCfiWYLoJP3KJQ3epdg56nWup",
    type: "JsonWebKey2020",
    controller: "did:key:z6Mkme1qqoZUua9KoWHKqBwUCfiWYLoJP3KJQ3epdg56nWup",
    publicKeyJwk: {
      kty: "OKP",
      crv: "Ed25519",
      x: "asMjc_QXIJ6UX6s2ulDwZGPY41CD5guwwgp28eC6aKM",
    },
    privateKeyJwk: {
      kty: "OKP",
      crv: "Ed25519",
      x: "asMjc_QXIJ6UX6s2ulDwZGPY41CD5guwwgp28eC6aKM",
      d: "Fq6Q39IGzSeZ1TjvJi-lly5Mx6VFXRc9gxFhX1PA-F8",
    },
  };

  const result = await verifiable.credential.create({
    credential: {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://w3id.org/security/suites/jws-2020/v1",
      ],
      id: endorsementObject.id,
      type: ["VerifiableCredential"],
      issuer: k.controller,
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: endorsementObject.claim,
      },
    },
    format: ["vc-jwt"],
    suite: new JsonWebSignature({ key: await JsonWebKey.from(k) }),
    documentLoader: endor.documentLoader,
  });
  const {
    items: [jwt],
  } = result;

  return jwt;
};

(async () => {
  console.log("🧙‍♂️ Endorsing claim...");

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
  const claimId = `urn:uuid:${uuidv4()}`;
  let claimObject;
  // persist claim
  try {
    const decodedClaim = endor.decodeJwt(claim.jwt);
    claimObject = {
      id: `https://or13.github.io/endor/claims/${claimId}.json`,
      issuer: decodedClaim.payload.iss,
      verify: "https://api.did.actor/v/" + claim.jwt,
      decoded: decodedClaim,
    };

    fs.writeFileSync(
      `./docs/claims/${claimId}.json`,
      JSON.stringify(claimObject, null, 2)
    );
    console.log("🌱 Claim persisted.");
  } catch (e) {
    console.log("🔥 Claim decoding failed.");
    process.exit(1);
  }

  // endorse claim
  try {
    const endorsementId = `urn:uuid:${uuidv4()}`;
    let endorsementObject = {
      id: `https://or13.github.io/endor/endorsements/${endorsementId}.json`,
      issuer: claimObject.issuer,
      claim: `https://or13.github.io/endor/claims/${claimObject.id}.json`,
    };
    const endorsementVcJwt = await getEndorsement(endorsementObject);
    const decodedEndorsement = endor.decodeJwt(endorsementVcJwt);
    endorsementObject.verify = "https://api.did.actor/v/" + endorsementVcJwt;
    endorsementObject.decoded = decodedEndorsement;

    fs.writeFileSync(
      `./docs/endorsements/${endorsementId}.json`,
      JSON.stringify(endorsementObject, null, 2)
    );
    console.log("🌱 Endorsement persisted.");
    fs.unlinkSync("./docs/inbox/claim.json");
  } catch (e) {
    console.log(e);
    console.log("🔥 Endorsement decoding failed.");
    process.exit(1);
  }

  process.exit(0);
})();
