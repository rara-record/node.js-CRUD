const router = require('express').Router();

// 홈
router.get('/', function(요청, 응답) {
  응답.render('index.ejs')
});

// 게시물 작성
router.get('/write', (요청, 응답) => {
  응답.render('write.ejs')
});

// 게시판 전송 
router.get('/list', function(요청, 응답) {
  요청.app.db.collection('post').find().toArray(function(에러, 결과 ) { // post db에 저장된 모든 데이터를 꺼내서
    console.log(결과);
    응답.render('list.ejs', {posts : 결과}); // 찾은 결과값과, ejs 파일을 전송해준다
  })
});

// 상세페이지 
router.get('/detail/:id', function(요청, 응답){ // :id => url의 파라미터
  console.log(요청.body)
  요청.app.db.collection('post').findOne({ _id : parseInt(요청.params.id) }, function(에러, 결과){ // _id가 params.id인 데이터 찾아줭
    응답.render('detail.ejs', { data : 결과 }) // 찾은 결과와, ejs파일 전송
  })
});

// 게시물 수정 페이지
router.get('/edit/:id', function(요청, 응답) {
  요청.app.db.collection('post').findOne({ _id : parseInt(요청.params.id) }, function(에러, 결과) {
     응답.render('edit.ejs', { post : 결과 }) // 찾은 결과를 edit.ejs로 보내주세용
  })
});

// 데이터 저장 및 업데이트
router.post('/add', function (요청, 응답) {
  요청.app.db.collection('counter').findOne({name : '게시물갯수'}, function(에러, 결과) { // db에서 게시물 갯수 데이터를 꺼낸다
    let 총게시물갯수 = 결과.totalPost // 꺼낸 게시물 갯수 데이터를 변수에 담는다

    요청.app.db.collection('post').insertOne({ _id : 총게시물갯수 + 1, 제목 : 요청.body.title, 날짜 : 요청.body.date }, 
    function (에러, 결과) { // post db에 총 게시물 갯수 +1, 요청받은 데이터들을 db에 저장한다

      요청.app.db.collection('counter').updateOne({name:'게시물갯수'},{ $inc: {totalPost:1} },function(에러, 결과){
      if(에러){return console.log(에러)} // 글번호 업데이트를 위해서, counter db에 게시물 갯수를 업데이트한다
      응답.send('전송완료');
      })
    })
  })
});

// 게시판 수정하기
router.put('/edit', function(요청, 응답) {
  요청.app.db.collection('post').updateOne({ _id : parseInt(요청.body.id) }, { $set : {제목 : 요청.body.title, 날짜 : 요청.body.date} },
  function(에러, 결과) { // updateOne ( { 어떤 게시물을 수정할지}, {수정값}, 콜백함수)
     console.log('수정완료')
     응답.redirect('/list') //수정시 게시판으로 이동
  })
});

// 게시물 삭제하기
router.delete('/delete', function(요청, 응답) {
  console.log(요청.body); //  ajax에서 data : { _id : ?? } => 요청.body 로 받아옴
  요청.body._id = parseInt(요청.body._id); // 요청받은 데이터는 꼭 정수로 변환
  요청.app.db.collection('post').deleteOne(요청.body, function(에러, 결과) { // 요청받은 데이터 (data : { _id : ?? }) 삭제
     console.log('삭제완료');
     응답.status(200).send( { message : '성공했습니다.' }); // 응답코드
  })
}); 

// 마이페이지 
router.get('/mypage', 로그인했니, function(요청, 응답) {
  console.log(요청.user)
  응답.render('mypage.ejs')
});

function 로그인했니(요청, 응답, next) {
  if (요청.user) { // 요청.user가 있는지 검사
    next()
  } else {
    응답.redirect('/login')
  }
}


module.exports = router;