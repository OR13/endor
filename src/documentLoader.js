const contexts = require("./contexts");

const documentLoader = (iri) => {
  if (contexts[iri]) {
    return { document: contexts[iri] };
  }

  const message = "Unsupported iri: " + iri;
  throw new Error(message);
};
module.exports = documentLoader;
