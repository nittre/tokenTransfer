const express = require("express");
const Web3 = require("web3");
const app = express();
const { User } = require("./models");
const abi = require("./abi.js");

const lightwallet = require("eth-lightwallet");

const port = 3000;
const provider = "http://localhost:7545";

const contractAddr = "컨트랙트 주소";

const web3 = new Web3(provider);

app.use(express.json());

app.get("/mnemonic/new", async (req, res) => {
    let mnemonic;

    mnemonic = lightwallet.keystore.generateRandomSeed();
    res.json({ mnemonic });
});

app.post("/wallet/new", async (req, res) => {
    let { username, password, mnemonic } = req.body;

    try {
        lightwallet.keystore.createVault(
            {
                password: password,
                seedPhrase: mnemonic,
                hdPathString: "m/0'/0'/0'",
            },
            async function (err, ks) {
                ks.keyFromPassword(
                    password,
                    async function (err, pwDerivedKey) {
                        ks.generateNewAddress(pwDerivedKey, 1);

                        let address = ks.getAddresses().toString();
                        let keystore = ks.serialize();
                        let privateKey = ks.exportPrivateKey(
                            address,
                            pwDerivedKey
                        );

                        User.update(
                            {
                                privateKey: privateKey,
                                address,
                            },
                            {
                                where: {
                                    username,
                                    password,
                                },
                            }
                        ).then((result) => {
                            const { username, address } = result;
                            res.json({
                                username,
                                address,
                            });
                        });
                    }
                );
            }
        );
    } catch (exception) {
        console.log("NewWallet ==>>>> " + exception);
    }
});

app.post("/ethFaucet", async (req, res) => {
    const faucet = await web3.utils.toWei(1);
    const { username, password } = req.body;

    const { privateKey } = await User.findOne({
        where: {
            username,
            password,
        },
    });

    const account = await web3.eth.accounts.privateKeyToAccount(privateKey);

    const tx = {
        from: "가나슈 가상 계정의 주소",
        to: account.address,
        value: faucet,
        gas: 100000,
    };

    const signedTx = await web3.eth.accounts.signTransaction(
        tx,
        "가나슈 가상 계정의 주소"
    );
    web3.eth.sendSignedTransaction(
        signedTx.rawTransaction,
        async (error, hash) => {
            if (!error) {
                const balance = web3.eth.getBalance(account.address);
                return res.status(200).send({
                    username,
                    address: account.address,
                    balance,
                    txHash: hash,
                });
            } else {
                return res
                    .status(404)
                    .send("Error: Faucet transaction failed (T.T)");
            }
        }
    );
});

app.post("/transfer", async (req, res) => {
    const { username, password, to, amount } = req.body;

    const { privateKey } = await User.findOne({
        where: {
            username,
            password,
        },
    });

    const account = await web3.eth.accounts.privateKeyToAccount(privateKey);

    const contract = new web3.eth.Contract(abi, contractAddr);

    const tx = {
        from: account.address,
        to: "보낼 이더리움 주소",
        data: contract.methods.transfer(to, amount).encodeABI(),
        value: "0x0",
        gas: "1000000",
        gasPrice: "100",
    };

    web3.eth.accounts
        .signTransaction(tx, privateKey, (err, res) => {
            if (err) {
                return res
                    .status(404)
                    .send("Error: signtransaction failed (T.T)");
            } else {
                return res;
            }
        })
        .then(async (res) => {
            const balance = await web3.eth.getBalance(account.address);
            web3.eth.sendSignedTransaction(
                res.rawTransaction,
                (err, txHash) => {
                    if (err) {
                        return res
                            .status(404)
                            .send(
                                "Error: send transfer transaction failed (T.T)"
                            );
                    } else {
                        return res.status(200).send({
                            txHash,
                            balance,
                        });
                    }
                }
            );
        });
});
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send({
        message: "Internal Server Error",
        stacktrace: err.toString(),
    });
});

app.listen(port, () => {
    console.log();
    console.log(`Server runs on http://localhost:${port}`);
});

module.exports = app;
