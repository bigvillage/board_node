// routes/post.js
const express = require('express')
const axios = require("axios");
const router = express.Router()
const List = require('../upload/models/upload') // mongoose 모델

// router.get('/list', async (req, res) => {
//   try {
//     const getList = await List.find().sort({ createdAt: -1 })
    
//     res.json(getList)
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: '서버 에러' })
//   }
// })
router.get('/list', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 5

        const skip = (page - 1) * limit

        // 전체 개수
        const total = await List.countDocuments()

        // 페이지 데이터
        const documents = await List.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
      // console.log("documents ==> ", documents);
      // console.log("total ==> ", total);
        res.json({
            documents,
            total
        })

    } catch (e) {
        res.status(500).json({
            message: '서버 오류'
        })
    }
})

router.get('/favorites', async (req, res) => {
  try {
    const docs = await List.find({ isFavorite: true }).sort({ createdAt: -1 })

    res.json(docs)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: '즐겨찾기 조회 실패' })
  }
})

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query

    const esRes = await axios.post(
      `${process.env.ES_URL}/documents/_search`,
      {
        query: {
          wildcard: {
            title: `*${q}*`
          }
        }
      },
      {
        auth: {
          username: 'elastic',
          password: "123!@#qwe"
        }
      }
    )
    console.log("q ==> ", q);

    const hits = esRes.data.hits.hits
    console.log("hits ==> ", hits);

    const result = hits.map(hit => ({
      _id: hit._id,
      ...hit._source
    }))

    res.json(result)

  } catch (e) {
    console.error(e.response?.data || e.message)
    res.status(500).json({ message: '검색 실패' })
  }
})

module.exports = router