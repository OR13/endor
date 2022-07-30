const fs = require("fs");
const path = require("path");

/**
 * @description Read files synchronously from a folder, with natural sorting
 * @param {String} dir Absolute path to directory
 * @returns {Object[]} List of object, each object represent a file
 * structured like so: `{ filepath, name, ext, stat }`
 */
const readFilesSync = (dir) => {
  const files = [];

  fs.readdirSync(dir).forEach((filename) => {
    const name = path.parse(filename).name;
    const ext = path.parse(filename).ext;
    const filepath = path.resolve(dir, filename);
    const stat = fs.statSync(filepath);
    const isFile = stat.isFile();

    if (isFile)
      files.push({
        filepath,
        name,
        ext,
        stat,
        content: fs.readFileSync(filepath).toString(),
      });
  });

  files.sort((a, b) => {
    // natural sort alphanumeric strings
    // https://stackoverflow.com/a/38641281
    return a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  return files;
};

const buildIssuers = () => {
  const files = readFilesSync("./docs/claims");
  const onlyClaims = files
    .filter((f) => {
      return f.name.includes("urn:uuid");
    })
    .map((f) => {
      return { ...f, json: JSON.parse(f.content) };
    });
  const index = {
    items: onlyClaims.map((f) => {
      return "https://api.did.actor/" + f.json.issuer;
    }),
  };
  fs.writeFileSync(`./docs/issuers/index.json`, JSON.stringify(index, null, 2));
  console.log("🌱 Issuer registry updated.");
};

const buildClaims = () => {
  const files = readFilesSync("./docs/claims");
  const onlyClaims = files
    .filter((f) => {
      return f.name.includes("urn:uuid");
    })
    .map((f) => {
      return { ...f, json: JSON.parse(f.content) };
    });
  const index = {
    items: onlyClaims.map((f) => {
      return f.json.id;
    }),
  };
  fs.writeFileSync(`./docs/claims/index.json`, JSON.stringify(index, null, 2));
  console.log("🌱 Claim registry updated.");
};

const buildEndorsements = () => {
  const files = readFilesSync("./docs/endorsements");
  const onlyClaims = files
    .filter((f) => {
      return f.name.includes("urn:uuid");
    })
    .map((f) => {
      return { ...f, json: JSON.parse(f.content) };
    });
  const index = {
    items: onlyClaims.map((f) => {
      return f.json.id;
    }),
  };
  fs.writeFileSync(
    `./docs/endorsements/index.json`,
    JSON.stringify(index, null, 2)
  );
  console.log("🌱 Endorsements registry updated.");
};

const buildSchemas = () => {
  const files = readFilesSync("./docs/policy/schemas");
  const onlyClaims = files
    .filter((f) => {
      return !f.name.includes("index");
    })
    .map((f) => {
      return { ...f, json: JSON.parse(f.content) };
    });
  const index = {
    items: onlyClaims.map((f) => {
      return "https://or13.github.io/endor/policy/schemas/" + f.name + ".json";
    }),
  };
  fs.writeFileSync(`./docs/policy/index.json`, JSON.stringify(index, null, 2));
  console.log("🌱 Policy registry updated.");
};

(async () => {
  console.log("🧙‍♂️ Building Registry...");
  buildIssuers();
  buildClaims();
  buildEndorsements();
  buildSchemas();
  process.exit(0);
})();
