const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// 새로 배포한 구글 앱스 크립트 웹앱 URL (재고현황 H열: 품목 / I열: 총재고 연동)
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzWX0TVR0_ZN9F-ShllRdAuMu3JsxVfxg_M79uYRkXcBaNkeX1ZIFyLSs9yKMmAl2w8/exec';

// 1. Better Stack 및 Health Check 경로
app.get('/', (req, res) => {
  res.status(200).send('Server is active and running!');
});

// 2. 카카오톡 오픈빌더 스킬 엔드포인트
app.post('/skill', async (req, res) => {
  try {
    const userUtterance = req.body.userRequest.utterance || '';
    
    // 사용자가 입력한 문장에서 제품 코드 추출 (공백 제거 후 영문+숫자 검색, 예: BC05, BC10JO 등)
    const cleanUtterance = userUtterance.replace(/\s+/g, '');
    const match = cleanUtterance.match(/[A-Za-z0-9_-]{2,15}/);
    
    if (!match) {
      return res.json({
        version: "2.0",
        template: {
          outputs: [{ simpleText: { text: "조회할 제품 코드를 입력해 주세요. (예: BC05)" } }]
        }
      });
    }

    const searchCode = match[0].replace(/[-_]/g, '').toUpperCase();

    // 구글 앱스 크립트(H/I열 재고 데이터) 호출
    const response = await axios.get(GAS_URL);
    const stockData = response.data || {};

    // 대소문자 및 특수문자 무시 유연 매칭
    let foundQty = undefined;
    let matchedItemName = searchCode;

    for (const [item, qty] of Object.entries(stockData)) {
      const normalizedItem = item.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (normalizedItem === searchCode) {
        foundQty = qty;
        matchedItemName = item;
        break;
      }
    }

    let replyText = "";
    if (foundQty !== undefined) {
      replyText = `[${matchedItemName}] 현재 총 재고는 ${foundQty}개입니다.`;
    } else {
      replyText = `[${searchCode}] 품목 정보를 찾을 수 없습니다.\n재고현황 시트의 H열 품목명을 확인해 주세요.`;
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
