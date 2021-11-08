// 서버를 띄우기 위한 기본 셋팅 - 서버 오픈 문법 (express 라이브러리) 
const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const LocalStrategy = require('passport-local').Strategy;
const passport = require('passport');
const session = require('express-session');
const methodOverride = require('method-override')
require('dotenv').config()

app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session()); 
app.use(express.urlencoded({extended: false})) 
app.use(express.json()); 
app.use('/public', express.static('public'))
app.use(methodOverride('_method'))
app.set('view engine', 'ejs');

// 라우터 분리
app.use('/', require('./routes/index.js') );

// DB접속하기
let db;
MongoClient.connect(process.env.DB_URL, {useUnifiedTopology: true, useNewUrlParser: true }, function(에러, client) {
   if (에러) return console.log(에러)
	db = client.db('todoapp'); // todoapp이라는 database에 연결좀여
   app.db = db;
   app.listen(process.env.PORT, function() {
      console.log('listening on 8080')
    })
});


// 로그인 페이지로
app.get('/login', function(요청, 응답){
   응답.render('login.ejs')
 });
 
 // router.post('/login', local 방식으로 회원인지 인증해주세요, callback)
 app.post('/login', passport.authenticate('local', {
   failureRedirect : '/login'
 }), function(요청, 응답){
   응답.redirect('/')
 });

// passport.authenticate 실행
passport.use(new LocalStrategy({
   usernameField: 'id',
   passwordField: 'pw',
   session: true,
   passReqToCallback: false,
 }, 
 // 사용자 아이디, 비번 인증
function (입력한아이디, 입력한비번, done) {
   // DB에서 id을 찾음
   db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
      if (에러) return done(에러)

      // 아이디와 DB아이디가 맞지 않다면
      if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
      // 입력한 비번과 DB에 비번이 맞다면 실행
      if (입력한비번 == 결과.pw) {
         return done(null, 결과)
      } else {
         return done(null, false, { message: '비번틀렸어요' })
      }
   })
}));


// id를 이용해서 세션을 저장시킴 (로그인 성공시 발동)
passport.serializeUser(function (user, done) {
   done(null, user.id)
});

// 세션 데이터를 가진 사람을 DB에서 찾음(마이페이지 접속시 발동)
passport.deserializeUser(function (아이디, done) {
   db.collection('login').findOne({ id: 아이디 }, function (에러, 결과) {
     done(null, 결과)
   })
}); 

// 마이페이지 
app.get('/mypage', 로그인했니, function (요청, 응답) {
   console.log(요청.user);
   응답.render('mypage.ejs')
}) 
 
 function 로그인했니(요청, 응답, next) {
   if (요청.user) { // 요청.user가 있는지 검사
     next()
   } else {
     응답.redirect('/login')
   }
}

// get요청으로 서버한테 데이터 전달하는법 
// search index에서 검색하는법
app.get('/search', (요청, 응답)=>{
   var 검색조건 = [
      {
         $search: {
            index: 'titleSearch',
            text: {
               query: 요청.query.value,
               path: '제목'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
            }
         }
      },
      { $sort : {_id : -1} }, // 아이디 순으로 정렬하기 (-는 내림차순)
      
      // { $project : { 제목 : 1, _id : 0, score : {$meta : "searchScore" } } } 검색 결과에 필터주기
      // { $limit : 10 } 열개까지 보여줌
   ] 
   console.log(요청.query);
   db.collection('post').aggregate(검색조건).toArray((에러, 결과)=>{
      console.log(결과)
      응답.render('search.ejs', {posts : 결과})
   })
})

