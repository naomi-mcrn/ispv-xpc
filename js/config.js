window.ISPV = {};
window.ISPV.network = XPChain.networks.xpchain;//`xpchain` for mainnet, `testnet` for testnet
window.ISPV.fee = 0.1000;//XPC (fixed or per kB fee);
window.ISPV.feetype = "per";//per,fix,auto(disabled now)
window.ISPV.dust = 0.0546;//XPC, less than it is dust!
window.ISPV.dryrun = true;//don't send really if true

//insight urls (auto switch)
window.ISPV.insight_urls = {
    mainnet: "https://cvmu.jp/insight/xpc/",
    testnet: "https://cvmu.jp/insight/xpc-test/"
}
window.ISPV.insight_api_urls = {
    mainnet: "https://cvmu.jp/insight/xpc/api/",
    testnet: "https://cvmu.jp/insight/xpc-test/api/"
}

//default value: to,amount TESTNET ONLY!
window.ISPV.defaults = { 
    to: "txpc1qtje728k2xkcyexva2cr5t7624j8q6ar2snedxm",
    amount: 10
}
