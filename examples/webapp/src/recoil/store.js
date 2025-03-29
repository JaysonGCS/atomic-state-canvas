"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logsAtom = exports.cusipToSecuritySelectorFamily = exports.enableMicroBatcherAtom = void 0;
const recoil_1 = require("recoil");
const apiClient_1 = require("../apiClient");
const constant_1 = require("../constant");
exports.enableMicroBatcherAtom = (0, recoil_1.atom)({
    key: 'enableMicroBatcherAtom',
    default: false
});
exports.cusipToSecuritySelectorFamily = (0, recoil_1.selectorFamily)({
    key: 'cusipToSecuritySelectorFamily',
    get: (cusip) => ({ get }) => {
        const enableMicroBatcher = get(exports.enableMicroBatcherAtom);
        if (enableMicroBatcher) {
            return (0, apiClient_1.decoratedFetchSingleSecurity)(cusip);
        }
        return (0, apiClient_1.fetchSingleSecurity)(cusip);
    },
    cachePolicy_UNSTABLE: { eviction: 'most-recent' }
});
exports.logsAtom = (0, recoil_1.atom)({
    key: 'logs',
    default: [],
    effects: [
        ({ setSelf, node, getPromise }) => {
            const logListener = (e) => __awaiter(void 0, void 0, void 0, function* () {
                const { detail } = e;
                const { log } = detail;
                const existing = yield getPromise(node);
                setSelf([...existing, log]);
            });
            document.addEventListener(constant_1.LOG_EVENT, logListener);
            return () => {
                document.removeEventListener(constant_1.LOG_EVENT, logListener);
            };
        }
    ]
});
//# sourceMappingURL=store.js.map