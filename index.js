const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// 구글 앱스 스크립트 웹앱 URL 반영 완료
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxlQrT-zJeNda4zbH30O_grkr23KhT0E159KKBuKQjjlJKjGLR4rL9X06kUr_SB-pXO/exec';

// 1. Better Stack 핑 및 Health Check용 루트 경로
app.get('/', (req, res) => {
  res.status(200).send('Server is active and running!');
});

// 2. 카카오톡 오픈빌더 스킬 엔드포인트
app.post('/skill', async (req, res) => {
  try {
    const userUtterance = req.body.userRequest.utterance || '';
    
    // 제품코드 추출 (예: BC05, bc10 등)
    const match = userUtterance.match(/[A-Za-z]{2}\d{2,4}/);
    if (!match) {
      return res.json({
        version: "2.0",
        template: {
          outputs: [{ simpleText: { text: "조회할 제품 코드를 입력해 주세요. (예: BC05)" } }]
        }
      });
    }

    const itemCode = match[0].toUpperCase();

    // GAS 호출
    const response = await axios.get(GAS_URL);
    const stockData = response.data;
    const qty = stockData[itemCode];

    let replyText = "";
    if (qty !== undefined) {
      replyText = `${itemCode} 제품의 현재 남은 재고는 ${qty}개입니다.`;
    } else {
      replyText = `${itemCode} 품목 정보를 찾을 수 없습니다.`;
    }

    return res.json({
      version: "2.0",
      template: {
        outputs: [{ simpleText: { text: replyText } }]
      }
    });

  } catch (error) {
    console.error('Skill Error:', error);
    return res.json({
      version: "2.0",
      template: {
        outputs: [{ simpleText: { text: "재고 조회 중 오류가 발생했습니다." } }]
      }
    });
  }
});

// Render 지정 포트 연결
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
