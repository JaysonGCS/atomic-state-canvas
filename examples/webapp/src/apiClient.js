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
exports.decoratedFetchSingleSecurity = exports.fetchSingleSecurity = void 0;
const micro_batcher_1 = require("micro-batcher");
const constant_1 = require("./constant");
const fetchSingleSecurity = (cusip) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockCusipToSecurityDataRecord[cusip]);
            console.log(`Fetched ${cusip}`);
            document.dispatchEvent(new CustomEvent(constant_1.LOG_EVENT, {
                detail: { log: `Fetched ${cusip}` }
            }));
        }, randomIntFromInterval(1000, 3000));
    });
});
exports.fetchSingleSecurity = fetchSingleSecurity;
const batchFetchSecurities = (cusips) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(cusips.map((cusip) => {
                return mockCusipToSecurityDataRecord[cusip];
            }));
            console.log(`[Batch] Fetched ${cusips}`);
            document.dispatchEvent(new CustomEvent(constant_1.LOG_EVENT, {
                detail: { log: `[Batch] Fetched ${cusips}` }
            }));
        }, randomIntFromInterval(1000, 3000));
    });
});
exports.decoratedFetchSingleSecurity = (0, micro_batcher_1.MicroBatcher)(exports.fetchSingleSecurity)
    .batchResolver(batchFetchSecurities, {
    payloadWindowSizeLimit: 4,
    batchingIntervalInMs: 50
})
    .build();
function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
const mockCusipToSecurityDataRecord = {
    AAPL: {
        cusip: 'AAPL',
        security: 'Apple Inc',
        price: 145.83,
        marketCap: 2410000000000
    },
    GOOGL: {
        cusip: 'GOOGL',
        security: 'Alphabet Inc',
        price: 2735.93,
        marketCap: 1840000000000
    },
    AMZN: {
        cusip: 'AMZN',
        security: 'Amazon.com Inc',
        price: 3379.09,
        marketCap: 1700000000000
    },
    NFLX: {
        cusip: 'NFLX',
        security: 'Netflix Inc',
        price: 513.97,
        marketCap: 227000000000
    },
    FB: {
        cusip: 'FB',
        security: 'Meta Platforms Inc',
        price: 336.61,
        marketCap: 950000000000
    },
    SPCX: {
        cusip: 'SPCX',
        security: 'Space Exploration Technologies Corp',
        price: 20.0,
        marketCap: 100000000000
    },
    NZAC: {
        cusip: 'NZAC',
        security: 'New Zealand Acquisition Corp',
        price: 10.0,
        marketCap: 50000000000
    },
    YOTAU: {
        cusip: 'YOTAU',
        security: 'YOTA Corp',
        price: 15.0,
        marketCap: 75000000000
    },
    IMXI: {
        cusip: 'IMXI',
        security: 'IMX Inc',
        price: 25.0,
        marketCap: 125000000000
    }
};
//# sourceMappingURL=apiClient.js.map