const router = require('express').Router();
const passport = require('passport');

// 로그인 페이지로
router.get('/login', function(요청, 응답){
  응답.render('login.ejs')
});

// router.post('/login', local 방식으로 회원인지 인증해주세요, callback)
router.post('/login', passport.authenticate('local', {
    failureRedirect : '/fail'
}), function(요청, 응답){
    응답.redirect('/')
});

module.exports = router;