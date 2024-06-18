import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const login =  async (req, res) => {
    try{
        console.log(req.body);
        const {email, password} = req.body;

        const user = await User.findOne({email: email}).select("+password");
        if(!user){
            return res.status(404).json({
                success: false,
                msg: 'User not found'
            });
        }

        const passwordMatched = await bcrypt.compare(password, user.password);

        if(!passwordMatched){
            return res.status(401).json({
                success: false,
                msg: 'Wrong password'
            })
        }

        const token = jwt.sign({
            user_id: user._id,
        }, process.env.JWT_SECRET, {expiresIn: "7d"});

        const options = {
            expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            httpOnly: true,
            secure : true,
            sameSite: "none"
        }

        return res.status(201).cookie('token',token,options).redirect('/')

    }catch (e) {
        res.status(500).json({
            success: false,
            msg: `An error occurred : ${e}`
        });
    }
}

const logout = async (req, res) => {
    try{
        const options = {
            expires: new Date(Date.now()),
            httpOnly: true,
            secure : true,
            sameSite: "none"
        }
        return res.status(200).cookie('token',null,options).redirect('/login');
    }catch (e) {
        return res.status(500).json({
            success: false,
            msg: `An error occurred : ${e}`
        })
    }
}

const register = async (req, res) => {
    try{
        const { name, email, password } = req.body;

        let user = await User.findOne({email: email});
        if(user){
            return res.status(401).json({
                success: false,
                msg: 'User already exists'
            })
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword
        })

        const token = jwt.sign({
            user_id: user._id
        }, process.env.JWT_SECRET, {expiresIn: "7d"});

        const options = {
            expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            httpOnly: true
        }

        return res.status(201).cookie('token',token,options).json({
            success: true,
            msg: "User Created",
            user,
            token
        })
    }catch (e) {
        res.status(500).json({
            success: false,
            msg: `${e}`
        })
    }
}

export {login, register, logout}
