export default {
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".js"],
  transform: {
    "^.+\\.js$": "babel-jest"
  },
  setupFilesAfterEnv: ["<rootDir>/setupTests.js"]
};
