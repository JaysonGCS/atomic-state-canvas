"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const client_1 = __importDefault(require("react-dom/client"));
const App_tsx_1 = __importDefault(require("./App.tsx"));
require("./index.css");
const recoil_1 = require("recoil");
client_1.default.createRoot(document.getElementById('root')).render(<react_1.default.StrictMode>
    <recoil_1.RecoilRoot>
      <App_tsx_1.default />
    </recoil_1.RecoilRoot>
  </react_1.default.StrictMode>);
//# sourceMappingURL=main.js.map