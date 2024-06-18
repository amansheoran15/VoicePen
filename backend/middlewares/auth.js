import jwt from "jsonwebtoken";

const authenticate = async (req,res,next)=>{
    {
        const {token} = req.cookies;

        if (!token) {
            return res.status(401).redirect('/login');
        }

        const decoded = await jwt.verify(token, process.env.JWT_SECRET);
        req.user_id = decoded.user_id;
        next();
    }
}

export default authenticate;