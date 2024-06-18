import express from 'express';
import {login, logout, register} from "../controllers/userController.js";
import authenticate from "../middlewares/auth.js";
const router = express.Router();

router.get('/login', (req,res)=>{
    res.render('login');
})
router.post('/login', login);
router.post('/register', register);
router.get('/logout', authenticate, logout);
router.get('/hello', authenticate, (req, res) => {
    return res.send("Authenticated");
})
export default router;