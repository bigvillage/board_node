// task/login/models/User.js
const mongoose = require('mongoose');

// 1. 스키마(Schema) 정의: 어떤 데이터가 들어갈지 설계도 그리기
const UserSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true  // 필수값
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,   // 중복 가입 방지 (이게 '인덱스' 역할을 합니다)
        lowercase: true // 소문자로 저장
    },
    password: { 
        type: String, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now // 가입 시간 자동 저장
    }
});

// 2. 모델(Model) 생성: 설계도를 바탕으로 실제 DB와 소통할 객체 만들기
// 첫 번째 인자 'User'는 MongoDB에서 소문자 복수형인 'users' 컬렉션으로 자동 변환됩니다.
module.exports = mongoose.model('User', UserSchema);