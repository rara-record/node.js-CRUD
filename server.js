// 서버를 띄우기 위한 기본 셋팅 - 서버 오픈 문법 (express 라이브러리) 
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(express.urlencoded({extended: true})) 
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs');
app.use('/public', express.static('public'))


// DB접속하기
let db;
MongoClient.connect('mongodb+srv://tododb:ssd10237879**@cluster0.metjd.mongodb.net/todoapp?retryWrites=true&w=majority', function(에러, client) {
   if (에러) return console.log(에러)

	db = client.db('todoapp'); // todoapp이라는 database에 연결좀여

   app.listen(8080, function() {    // 8080에 node.js 서버 띄우셈
      console.log('listening on 8080')
   })
});

/* 
   POST요청 처리하는 기계 제작하기 app.post()
   어떤 사람이.. /add 경로로 POST 요청을 하면..
   Database에 자료 저장을 해주세요~
*/

/* 
   Database에 자료 저장하는 법
   1. post로 요청옴
   2. db에 counter라는 콜렉션에서 totalPost라는 총 게시물 갯수 숫자를 가져옴 (꺼내기)
   3. var 총게시물갯수 = 여기에 저장함
   4. collection에 자료 추가 ==> insertOne{저장할데이터
   5. db데이터 수정(업데이트) => counter라는 콜렉션에 totalPost 항목 +1 해주기 
*/
app.post('/add', function (요청, 응답) {
   db.collection('counter').findOne({name : '게시물갯수'}, function(에러, 결과){
     var 총게시물갯수 = 결과.totalPost
 
     db.collection('post').insertOne({ _id : 총게시물갯수 + 1, 제목 : 요청.body.title, 날짜 : 요청.body.date }, function (에러, 결과) {
       db.collection('counter').updateOne({name:'게시물갯수'},{ $inc: {totalPost:1} },function(에러, 결과){
         if(에러){return console.log(에러)}
         응답.send('전송완료');
       })
     })
   })
 });


 /* 
   HTML에 DB데이터 꽂아넣기 (db꺼내기)

   list로 get요청으로 접속하면 
   실제 DB에 저장된 데이터들 꺼내서 예쁘게 꾸며진 html보여줌
   서버에서 .html말고 .ejs파일 보내주는 법
*/
 app.get('/list', function(요청, 응답) {
   // 데이터 다찾아주세용
   db.collection('post').find().toArray(function(에러, 결과 ) { 
      console.log(결과);
      // 찾은걸 ejs파일에 집어넣어주세용
      응답.render('list.ejs', {posts : 결과});
   })
});

/*
   delete요청하기

   요청받은 데이터 정수로 변환
   deleteOnde{데이터}로 삭제
*/
app.delete('/delete', function(요청, 응답) {
   console.log(요청.body); // 요청시 함께 보낸 데이터 찾으려면 요로케
   요청.body._id = parseInt(요청.body._id);
   db.collection('post').deleteOne(요청.body, function(에러, 결과) {
      console.log('삭제완료');
      응답.status(200).send( { message : '성공했습니다.' }); // 응답코드
   })
}); 

/* 
   상세페이지 만들기

   detail/:id << url의 파라미터
   요청.params.id << url의 파라미터
   어떤 사람이 detail/?? 으로 접속하면
   DB에서 {_id: ??}인 게시물을 찾음
   찾은 결과를 detail.ejs로 보내주세용
*/ 
app.get('/detail/:id', function(요청, 응답){
   db.collection('post').findOne({ _id : parseInt(요청.params.id) }, function(에러, 결과){
     응답.render('detail.ejs', { data : 결과 })
   })
 });

/*
   edit페이지
   /edit/:id 로 라우팅하기
   게시글마다 각각 다른 edit.esj내용이 필요함
*/
app.get('/edit/:id', function(요청, 응답) {
   db.collection('post').findOne({ _id : parseInt(요청.params.id) }, function(에러, 결과) {
      console.log(결과)
      응답.render('edit.ejs', { post : 결과 }) // 찾은 결과를 edit.ejs로 보내주세용
   })
});

/* 
   GET요청을 처리하는 기계 제작하기 add.get()
   - 누군가가 /write로 방문을 하면..
   - write관련된 안내문을 띄워주자
*/ 

/* '/'하나만 쓰면 홈페이지로 */
app.get('/', function(요청, 응답) {
   응답.render('index.ejs')
});

// ES6 신문법
app.get('/write', (요청, 응답) => {
   응답.render('write.ejs')
});