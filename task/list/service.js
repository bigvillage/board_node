// routes/post.js
const express = require('express')
const router = express.Router()
const List = require('../upload/models/upload') // 네 mongoose 모델

router.get('/list', async (req, res) => {
  try {
    const getList = await List.find().sort({ createdAt: -1 })
    
    res.json(getList)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: '서버 에러' })
  }
})

module.exports = router