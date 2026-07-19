import { Scheme } from "./scheme";

/** SPEC.md §4.0: the plaintext carried raw, no encryption, passphrase ignored. */
export const v0: Scheme = {
  encrypts: false,
  requiredParams: ["c"],
  decode: async (params) => {
    if (!params.c) throw new Error(`v0: payload missing content key "c"`);
    return new TextDecoder().decode(params.c);
  },
};
