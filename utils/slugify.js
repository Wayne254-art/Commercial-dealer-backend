// utils/slugify.js
import slugify from "slugify";

export const generateSlug = (text) => {
  return slugify(text, {
    lower: true,
    strict: true, // removes special characters
    remove: /[*+~.()'"!:@]/g
  });
};
