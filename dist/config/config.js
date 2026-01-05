"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOctokitClient = void 0;
const rest_1 = require("@octokit/rest");
const getOctokitClient = (auth) => {
    return new rest_1.Octokit({ auth });
};
exports.getOctokitClient = getOctokitClient;
//# sourceMappingURL=config.js.map