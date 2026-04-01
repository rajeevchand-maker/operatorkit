import { loadConfig } from "../src/config";
import { signDemoToken } from "../src/security/auth";

const config = loadConfig();
console.log(signDemoToken(config));
