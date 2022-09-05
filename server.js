const fs = require('fs');
const https = require('https');
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const passport = require('passport');
const {Strategy} = require('passport-google-oauth20');
const cookieSession = require('cookie-session');

require('dotenv').config();

const PORT = 3000;
const app = express();

const config = {
    CLINT_ID: process.env.CLINT_ID,
    CLINT_SECRET:process.env.CLINT_SECRET,
    COOKIE_KEY_1:process.env.COOKIE_KEY_1,
    COOKIE_KEY_2:process.env.COOKIE_KEY_2,
}


const AUTH_OPTIONS = {
    callbackURL:'/auth/google/callback',
    clientID:config.CLINT_ID,
    clientSecret:config.CLINT_SECRET
}


function verifCallBack(accessToken, refreshToken, profile, done){
    // console.log('Google Profile', profile);
    done(null, profile);

}

passport.use(new Strategy(AUTH_OPTIONS,  verifCallBack ))

passport.serializeUser((user, done) =>{
    done(null, user.id);
})

passport.deserializeUser((obj, done) =>{
    console.log(obj);
    done(null, obj);
})


app.use(helmet());

app.use(cookieSession({
    name: "session",
    maxAge: 24 * 60 * 60 * 1000,
    keys:[config.COOKIE_KEY_1, config.COOKIE_KEY_1]
}));

app.use(passport.initialize());
app.use(passport.session());

function checkLoggedIn(req, res, next){
    const isLoggedIn = req.user ; //TODO 
    console.log(req.user);
    if(!isLoggedIn){
        return res.status(401).json({
            error: 'You Must login'
        })
    }
    next();
}

app.get('/auth/google', passport.authenticate('google',{
    scope:['email']
}));

app.get('/auth/google/callback',
 passport.authenticate('google',{
    failureRedirect: '/failure',
    successRedirect: '/',
    session: true,
    }),
    (req, res)=>{
    console.log('Google called us back')  
});

app.get('/auth/logout', (req, res)=>{
    req.logout(); // Remove request.users and clear logged in session 
    return res.redirect('/');
});


app.get('/secret', checkLoggedIn, (req, res)=>{
    return res.send('Your personal secret value is 42');
});

app.get('/failure', (req, res)=>{
    return res.send('Failed to log in');
})

app.get('/', (req, res)=>{
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
})

https.createServer({
    key: fs.readFileSync('key.pem'),
    cert:fs.readFileSync('cert.pem')
}, app).listen(PORT,()=>{
    console.log(`Listining on port ${PORT}...`);
})

// app.listen(PORT, ()=>{
//     console.log(`Listining on port ${PORT}...`);
// })

