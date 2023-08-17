# SolBalancer
A simple yet efficient Solana rpc load balancer


## Overview

SolBalancer is a lightweight, robust Node.js server designed to act as a load balancer for Solana RPC nodes. By monitoring the health of RPC nodes and routing requests based on response times, SolBalancer ensures optimal and uninterrupted access to the Solana network.

---

## Features

1. **Health Checks**: Periodically checks the health of all RPC nodes to determine their availability.
2. **Load Balancing**: Routes requests to the RPC node with the best response time.
3. **Fault Tolerance**: Automatically reroutes requests if an RPC node is down or not responding.
4. **Caching**: Caches responses to improve response times and reduce the load on RPC nodes.

---

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

1. Clone the repository:
```bash
git clone <repository_url>
```

2. Navigate to the project directory:
```bash
cd SolBalancer
```

3. Install dependencies:
```bash
npm install
```

---

## Usage

1. Start the development server:
```bash
npm run dev
```

2. By default, the server will start on port 9090. Access it at:
```
http://localhost:9090
```

3. Send POST requests to the server's root endpoint with the desired method and parameters to interact with the Solana network.

---

## Configuration

- **RPC Nodes**: The system uses a predefined list of RPC node URLs. You can modify this list to include your preferred RPC nodes.
  
- **Cache Configuration**: Modify cache settings such as duration and interval to suit the demands of your application.

---

## Contributing

1. Fork the repository.
2. Create a new branch for your features or fixes.
3. Send a pull request.

---

## Future Enhancements

1. **Multiple Strategies**: Incorporate various load-balancing strategies like Round Robin, Weighted, etc.
2. **Analytics Dashboard**: Implement a UI to visualize traffic, response times, and node health.
3. **Extended Caching**: Enhance caching mechanisms to support distributed caches like Redis.

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## Support & Feedback

For support, feature requests, or feedback, please open an issue on the GitHub repository or contact the maintainer directly.

---

## Acknowledgements

- Solana
- Express.js
- Axios

---

This documentation provides a comprehensive introduction to SolBalancer, detailing its features, installation steps, usage, and more. As the project grows and evolves, it's crucial to keep the documentation updated to reflect any changes.