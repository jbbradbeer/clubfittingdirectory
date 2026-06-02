import next from "eslint-config-next"

/* ESLint 9 flat config. Without this file, `npm run lint` errored out and did
   nothing. eslint-config-next ships a native flat-config array, so we spread it
   directly (the older FlatCompat.extends() approach throws a circular-JSON error
   against this version). */
const eslintConfig = [
  ...next,
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
]

export default eslintConfig
