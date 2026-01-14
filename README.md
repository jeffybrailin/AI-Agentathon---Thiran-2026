# Fake Product Detection - AI Agentathon Thiran 2026

## Problem Statement
The proliferation of counterfeit products in the global market poses a significant threat to brand integrity and consumer safety. Traditional supply chain tracking methods are often opaque and susceptible to manipulation, making it difficult for end consumers to verify the authenticity of the products they purchase.

## Solution Description
This project is a **Blockchain-based Supply Chain Management System** designed to ensure product authenticity. By leveraging the immutability of the Ethereum blockchain (simulated via Ganache), manufacturers can register products with unique codes. These products are tracked through the supply chain. Consumers can verify the provenance and authenticity of a product by scanning a QR code or entering the product ID, instantly revealing its entire history and confirming it is not a fake.

## Agent Workflow (AI Agent Contribution)
This project was autonomously modernized and deployed by an **AI Agent**. The workflow executed was:
1.  **Codebase Analysis**: The Agent analyzed the original legacy PHP/MySQL codebase to understand the logic and database schema.
2.  **Platform Migration**: Identified that the user lacked the PHP environment, so the Agent autonomously **ported the entire backend to Node.js** using Express and SQLite.
3.  **Blockchain Integration**: The Agent installed and configured a **local Ganache blockchain**, compiled the Solidity smart contracts, and deployed them dynamically upon server start.
4.  **UI/UX Overhaul**: The Agent completely redesigned the frontend with a **"Cyber-Scanner" theme**, implementing 3D grid animations, glassmorphism, and a high-tech aesthetic using vanilla CSS.
5.  **Deployment Prep**: The Agent finalized the prototype and prepared the repository for submission.

## Results & Demo
The prototype successfully demonstrates the core authentication flow. A live version is deployed on Vercel (running in "Lite Mode" with mocked blockchain for demonstration purposes).

### Live Demo
[**Click Here to View Live Prototype**](https://ai-agentathon-thiran-2026-lfbs.vercel.app/)



## Tech Stack Used
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database**: SQLite (Local), In-Memory Mock (Vercel)
*   **Blockchain**: Ganache (Local Ethereum Testnet)
*   **Smart Contracts**: Solidity (Compiled via `solc`)
*   **Web3 Integration**: Web3.js
*   **Frontend**: EJS (Templating), CSS3 (Advanced Animations)
*   **Tools**: Git

## Setup and Execution Steps

### Prerequisites
*   Node.js installed.

### Installation
1.  Clone the repository:
    ```bash
    git clone https://github.com/jeffybrailin/AI-Agentathon---Thiran-2026.git
    cd AI-Agentathon---Thiran-2026
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
    *Note: This will install express, web3, ganache, solc, sqlite3, etc.*

### Running the Application
1.  Start the server:
    ```bash
    node server.js
    ```
2.  The server will automatically:
    *   Start a local Ganache blockchain instance on port 7545.
    *   Compile and Deploy the Smart Contract.
    *   Start the Web Server.

3.  Access the application in your browser:
    *   **http://localhost:3000**

## Prototype Link
*   **GitHub Repo**: [https://github.com/jeffybrailin/AI-Agentathon---Thiran-2026](https://github.com/jeffybrailin/AI-Agentathon---Thiran-2026)
*   **Live Demo**: [https://ai-agentathon-thiran-2026-lfbs.vercel.app/](https://ai-agentathon-thiran-2026-lfbs.vercel.app/)
