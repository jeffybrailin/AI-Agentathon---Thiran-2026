const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const md5 = require('md5');
const fs = require("fs");

// Detect if running on Vercel or standard local environment
const IS_VERCEL = process.env.VERCEL || process.env.NODE_ENV === 'production';

// Conditional imports for Local Development only
let db;
let ganache;
let Web3;
let solc;

if (!IS_VERCEL) {
    try {
        const sqlite3 = require('sqlite3').verbose();
        db = new sqlite3.Database('./supplychain.db');
        ganache = require("ganache");
        Web3 = require("web3");
        solc = require("solc");
    } catch (e) {
        console.log("Optional dependencies missing, falling back to mock mode.");
    }
} else {
    // Mock DB for Vercel (In-Memory) to prevent Read-Only File System errors
    db = {
        users: [],
        get: (query, params, callback) => {
            // Universal Mock Login for Vercel Demo
            // Accepts ANY credentials to prevent "Database Error" on serverless restart
            const email = params[0];
            const pw = params[1];

            // Create a mock user based on input
            const user = {
                email: email,
                password: pw,
                role: 0, // Default to Manufacturer/Consumer for demo
                username: 'DemoUser'
            };

            console.log("Mock DB: Universal Login Success for", email);
            callback(null, user);
        },
        run: (query, params, callback) => {
            // Simple mock for registration
            db.users.push({
                email: params[0],
                username: params[1],
                password: params[2],
                role: params[3]
            });
            console.log("Mock DB: User Registered", params[0]);
            callback(null);
        }
    };
}

const app = express();
const PORT = process.env.PORT || 3000;

// Ganache Setup (Skipped on Vercel)
const ganacheOptions = { logging: { quiet: true } };
let ganacheServer = (!IS_VERCEL && ganache) ? ganache.server(ganacheOptions) : null;

async function setupBlockchain() {
    if (IS_VERCEL || !ganacheServer) {
        console.log("Skipping Blockchain Setup (Vercel/Lite Mode)");
        return;
    }

    return new Promise((resolve, reject) => {
        ganacheServer.listen(7545, async (err) => {
            if (err) return reject(err);
            console.log("Ganache Blockchain running on port 7545");

            try {
                const web3 = new Web3("http://127.0.0.1:7545");
                const accounts = await web3.eth.getAccounts();
                const deployerAccount = accounts[0];
                console.log("Deploying contract with account:", deployerAccount);

                // Read Contract
                const contractSource = fs.readFileSync(path.join(__dirname, 'smartcontract', 'smartcontract.sol'), 'utf8');

                // Compile Contract (Simple solc usage)
                var input = {
                    language: 'Solidity',
                    sources: { 'smartcontract.sol': { content: contractSource } },
                    settings: { outputSelection: { '*': { '*': ['*'] } } }
                };

                const output = JSON.parse(solc.compile(JSON.stringify(input)));
                const contractABI = output.contracts['smartcontract.sol']['SupplyChain'].abi;
                const contractBytecode = output.contracts['smartcontract.sol']['SupplyChain'].evm.bytecode.object;

                // Deploy
                const contract = new web3.eth.Contract(contractABI);
                const deployedContract = await contract.deploy({ data: contractBytecode })
                    .send({ from: deployerAccount, gas: 1500000, gasPrice: '30000000000' });

                console.log("Contract deployed at address:", deployedContract.options.address);

                // Update app.js
                let appJspath = path.join(__dirname, 'app.js');
                let appJsContent = fs.readFileSync(appJspath, 'utf8');

                // Update Address & ABI
                appJsContent = appJsContent.replace(/var contractAddress ='.*';/, `var contractAddress ='${deployedContract.options.address}';`);
                const abiString = JSON.stringify(contractABI, null, 2);
                appJsContent = appJsContent.replace(/var contractAbi =\[[\s\S]*?\];/, `var contractAbi =${abiString};`);

                fs.writeFileSync(appJspath, appJsContent);
                console.log("Updated app.js with new contract address and ABI.");

                resolve();
            } catch (e) {
                console.error("Error deploying contract:", e);
                resolve();
            }
        });
    });
}

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // Serve static files from root
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

// Routes

app.get('/', (req, res) => {
    if (req.session.role !== undefined) {
        res.redirect('/checkproducts');
    } else {
        res.render('index', { role: undefined, error: null });
    }
});

app.post('/login', (req, res) => {
    const email = req.body.email;
    const password = md5(req.body.pw);

    db.get("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, row) => {
        if (err) {
            console.error(err);
            res.render('index', { role: undefined, error: "Database error" });
        } else if (row) {
            req.session.role = row.role;
            req.session.username = row.username;
            req.session.email = row.email;
            res.redirect('/checkproducts');
        } else {
            res.render('index', { role: undefined, error: "Please check your Email and Password and try again." });
        }
    });
});

app.post('/registration', (req, res) => {
    const email = req.body.email;
    const username = req.body.username;
    const password = md5(req.body.pw);
    const role = req.body.role;

    db.run("INSERT INTO users (email, username, password, role) VALUES (?, ?, ?, ?)", [email, username, password, role], function (err) {
        if (err) {
            console.error(err);
            res.render('index', { role: undefined, error: "Registration failed." });
        } else {
            if (IS_VERCEL) {
                // For Vercel, loop directly to login/checkproducts
                req.session.role = role;
                req.session.username = username;
                req.session.email = email;
                return res.redirect('/checkproducts');
            }
            res.render('index', { role: undefined, error: "Registration successful! Please login." });
        }
    });
});

app.get('/checkproducts', (req, res) => {
    if (req.session.role === undefined) {
        res.redirect('/');
    } else {
        res.render('checkproducts', { role: req.session.role, result: null });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});


app.get('/addproducts', (req, res) => {
    if (req.session.role === undefined) res.redirect('/');
    else res.send("Add Products Page (Vercel Demo: Backend Logic Disabled)");
});
app.get('/scanshipment', (req, res) => {
    if (req.session.role === undefined) res.redirect('/');
    else res.send("Ownership Transfer Page (Vercel Demo: Backend Logic Disabled)");
});
app.get('/profile', (req, res) => {
    if (req.session.role === undefined) res.redirect('/');
    else res.send("Profile Page (Vercel Demo: Backend Logic Disabled)");
});

app.post('/checkproducts', (req, res) => {
    // Mock Verification Logic for Vercel Demo
    const productCode = req.body.productCode;
    console.log("Checking Product:", productCode);

    if (IS_VERCEL) {
        const isReal = (productCode === '12345' || productCode === 'REAL');

        let resultData = null;
        if (isReal) {
            resultData = {
                id: productCode,
                name: "Genuine Leather Bag (Demo)",
                description: "Authentic premium leather product. Verified on Blockchain.",
                manufactureDate: "2026-01-10",
                expiryDate: "N/A",
                owner: "Demo User",
                status: "Real Product",
                isReal: true
            };
        } else {
            resultData = {
                id: productCode,
                name: "Unknown Product",
                description: "This product code does not exist in the blockchain registry.",
                status: "Fake Product",
                isReal: false
            };
        }

        // Render the EJS template with the result
        res.render('checkproducts', { role: req.session.role || 0, result: resultData });

    } else {
        res.send("Blockchain verification unavailable in this environment.");
    }
});


// Start
setupBlockchain().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
