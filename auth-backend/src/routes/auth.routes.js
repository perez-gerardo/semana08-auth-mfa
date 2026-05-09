const { Router } = require('express');
const { register, login }             = require('../controllers/auth.controller');
const { setup, activate, verify, disable } = require('../controllers/mfa.controller');
const { verifyToken, verifyMfaToken } = require('../middleware/auth.middleware');

const router = Router();

// ── Auth básico ──────────────────────────────────────────
router.post('/register', register);
router.post('/login',    login);

// ── MFA Setup/Activate — requiere access_token normal ───
router.post('/mfa/setup',    verifyToken, setup);
router.post('/mfa/activate', verifyToken, activate);
router.post('/mfa/disable',  verifyToken, disable);

// ── MFA Verify durante login — requiere mfa_token ───────
router.post('/mfa/verify', verifyMfaToken, verify);

module.exports = router;