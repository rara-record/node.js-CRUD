// 서버를 띄우기 위한 기본 셋팅 - 서버 오픈 문법 (express 라이브러리) 
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const LocalStrategy = require('passport-local').Strategy;
const passport = require('passport');
const session = require('express-session');
const methodOverride = require('method-override');
require('dotenv').config()


app.use(express.urlencoded({extended: false})) 
app.use(express.json()); 
app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session()); 
app.use('/public', express.static('public'))
app.use(methodOverride('_method'))
app.set('view engine', 'ejs');

// DB접속하기
let db;
MongoClient.connect(process.env.DB_URL, {useUnifiedTopology: true, useNewUrlParser: true }, function(에러, client) {
   if (에러) return console.log(에러)
	db = client.db('todoapp'); // todoapp이라는 database에 연결좀여
   app.db = db;

   http.listen(process.env.PORT, function() {
      console.log('listening on 8080')
    })
});

// 홈
app.get('/', function(요청, 응답) {
   응답.render('index.ejs')
 });
 
 // 게시물 작성
 app.get('/write', (요청, 응답) => {
   응답.render('write.ejs')
 });
 
 // 게시물 전송해서 게시판 파일 전송
 app.get('/list', function(요청, 응답) {
   db.collection('post').find().toArray(function(에러, 결과 ) { // post db에 저장된 모든 데이터를 꺼내서
     console.log(결과);
     응답.render('list.ejs', {posts : 결과}); // 찾은 결과값과, ejs 파일을 전송해준다
   })
 });
 
// 게시물 수정 페이지
 app.get('/edit/:id', function(요청, 응답) {
   db.collection('post').findOne({ _id : parseInt(요청.params.id) }, function(에러, 결과) {
      응답.render('edit.ejs', { post : 결과 }) // 찾은 결과를 edit.ejs로 보내주세용
   })
 });
 
// 게시판 수정하기
 app.put('/edit', function(요청, 응답) {
   db.collection('post').updateOne({ _id : parseInt(요청.body.id) }, { $set : {제목 : 요청.body.title, 날짜 : 요청.body.date} },
   function(에러, 결과) { // updateOne ( { 어떤 게시물을 수정할지}, {수정값}, 콜백함수)
      console.log('수정완료')
      응답.redirect('/list') //수정시 게시판으로 이동
   })
});

// 상세페이지 
app.get('/detail/:id', function(요청, 응답){ // :id => url의 파라미터
   console.log(요청.body)
   db.collection('post').findOne({ _id : parseInt(요청.params.id) }, function(에러, 결과){ // _id가 params.id인 데이터 찾아줭
      응답.render('detail.ejs', { data : 결과 }) // 찾은 결과와, ejs파일 전송
   })
});

// 로그인 페이지로
app.get('/login', function(요청, 응답){
   응답.render('login.ejs')
});
 
// 로그인 인증
// app.post('/login', local 방식으로 회원인지 인증해주세요, callback)
 app.post('/login', passport.authenticate('local', {
   successRedirect: '/',
   failureRedirect : '/login'
 }));

// 로그인 passport.authenticate 실행
passport.use('local', new LocalStrategy({
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

 // 게시물 데이터 저장 및 업데이트
 app.post('/add', function (요청, 응답) {
   db.collection('counter').findOne({name : '게시물갯수'}, function(에러, 결과) { // db에서 게시물 갯수 데이터를 꺼낸다
      console.log(결과.totalPost);

     let 총게시물갯수 = 결과.totalPost // 꺼낸 게시물 갯수 데이터를 변수에 담는다
     let 저장할거 = { 
       _id : 총게시물갯수 + 1, 
       작성자 : 요청.user.id,
       제목 : 요청.body.title, 
       날짜 : 요청.body.date, 
     }
 
     db.collection('post').insertOne(저장할거, function (에러, 결과) { // post db에 총 게시물 갯수 +1, 요청받은 데이터들을 db에 저장한다
 
       db.collection('counter').updateOne({name:'게시물갯수'},{ $inc: {totalPost:1} },function(에러, 결과){
       if(에러){return console.log(에러)} // 글번호 업데이트를 위해서, counter db에 게시물 갯수를 업데이트한다
       응답.redirect('/write');
       })
     })
   })
});

// 게시물 삭제하기
app.delete('/delete', function(요청, 응답) {
   console.log(요청.body); //  ajax에서 data : { _id : ?? } => 요청.body 로 받아옴
   요청.body._id = parseInt(요청.body._id); // 요청받은 데이터는 꼭 정수로 변환


   // 둘다 만족하는 데이터 지워줌
   let 삭제할데이터 = { _id : 요청.body._id, 작성자 : 요청.user.id }

   // 요청.body에 담겨온 데이터 (data : { _id : ?? }) 삭제
   db.collection('post').deleteOne(삭제할데이터, function(에러, 결과) { 
      console.log('삭제완료');
      if (결과) {console.log(결과)}
      응답.status(200).send( { message : '성공했습니다.' }); // 응답코드
   })
}); 

// 마이페이지 
app.get('/mypage', 로그인했니, function (요청, 응답) {
   console.log(요청.user);
   응답.render('mypage.ejs')
}); 
 
 function 로그인했니(요청, 응답, next) {
   if (요청.user) { // 요청.user가 있는지 검사
      console.log(요청.user)
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
});

// 회원가입
app.post('/register', (요청, 응답) => {
   db.collection('login').insertOne( { id : 요청.body.id, pw : 요청.body.pw }, 
      function(에러, 결과) {
         응답.redirect('/');
   }) 
});

// multer를 이용한 이미지 하드에 저장하기
let multer = require('multer');
var storage = multer.diskStorage({

  destination : function(req, file, cb){
    cb(null, './public/image')
  },
  filename : function(req, file, cb){
    cb(null, file.originalname)
  },
  // 파일형식 (확장자) 거르기
  fileFilter: function (req, file, callback) {
   var ext = path.extname(file.originalname);
   if(ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
       return callback(new Error('PNG, JPG만 업로드하세요'))
   }
   callback(null, true)
   }
});

// 이미지 업로드시 multer 동작시키기
let upload = multer({storage : storage});
app.post('/upload', upload.single('테스트이미지네임'), (요청, 응답) => {
   응답.send('이미지 업로드 완료');
});

// 이미지 업로드/서버 만들기
app.get('/upload', (요청, 응답) => {
   응답.render('upload.ejs');
});

// 업로드한 이미지 보여주기
app.get('/image/:imageName', (요청, 응답) => {
   응답.sendFile( __dirname + '/public/image/'  + 요청.params.imageName )
});

// chatroom 디비에 저장 (로그인필요)
app.post('/chatroom', 로그인했니, (요청, 응답) => {

   const 저장할거 = {
      title : '무슨무슨채팅방',
      member : [요청.body.당한사람id, 요청.user._id], // 현재로그인한유저
      date : new Date()
   }

   db.collection('chatroom').insertOne(저장할거).then(function(결과){
      응답.send('저장완료')
   });
});

// 내가 속한 채팅방 게시물도 보여주기
app.get('/chat', 로그인했니, function(요청, 응답){ 

   db.collection('chatroom').find({ member : 요청.user._id }).toArray().then((결과)=>{
     console.log(결과);
     응답.render('chat.ejs', {data : 결과})
   })
}); 

// 메세지 발행하기
app.post('/message', 로그인했니, function(요청, 응답){ 
   var 저장할거 = {
      parent : 요청.body.parent,
      content: 요청.body.content,
      userid : 요청.user._id,
      date : new Date(),
   }

   db.collection('message').insertOne({저장할거}).then((결과)=> {
      console.log('DB저장성공')
      응답.send('DB저장성공')
   })
}); 

// 채팅방 누르면 메세지 보내주기 : 서버와의 실시간 소통(SSE) 
app.get('/message/:parentid', 로그인했니, function(요청, 응답){

   응답.writeHead(200, {
     "Connection": "keep-alive",
     "Content-Type": "text/event-stream",
     "Cache-Control": "no-cache",
   });
   
   db.collection('messages').find({parent : 요청.params.parentid }).toArray().then((결과) => {
      응답.write(`event: test\n`);
      // 응답.write('data: '+ JSON.stringify(결과) +'\n\n');
      응답.write(`data:${JSON.stringify(결과)}\n\n`);
   })
 });

// 웹소켓 페이지
app.get('/socket', (요청, 응답) => {
   응답.render('socket.ejs')
});

// 웹소켓에 접속하면 실행할 것 
io.on('connection', (socket) => {
   console.log('유저접속됨');

   // room1-send 메세지 받으면 실행할것
   socket.on('room1-send', (data) => { // 메세지 수신
      io.to('room1').emit('broadcast', data)
   });
   
   // joinroom이름으로 메세지 받으면 실행할것
   socket.on('joinroom', (data) => { // 메세지 수신
      socket.join('room1'); // 채팅방 생성+입장
      console.log('룸으로 들어옴')
   });
   
   // user-send이름으로 메세지 받으면 실행할것
   socket.on('user-send', (data) => { // 메세지 수신
      io.emit('broadcast', data) // 서버-> 유저 메세지전송 io.emit
   });
});