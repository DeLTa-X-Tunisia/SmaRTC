"use strict";
// =============================================================================
// SmaRTC TypeScript Example - Serveur Express avec interface de chat
// =============================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3500;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// Route principale
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/index.html'));
});
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Démarrage du serveur
app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║          SmaRTC TypeScript Chat Example                      ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║  🌐 Application: http://localhost:${PORT}                       ║`);
    console.log('║  📡 API SmaRTC: http://localhost:8080                        ║');
    console.log('║  🔌 SignalR Hub: http://localhost:5001/signalhub             ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║  Ouvrez l\'URL dans votre navigateur pour commencer          ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
});
//# sourceMappingURL=server.js.map