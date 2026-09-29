const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const GAS_URL = '여기에_GAS_웹앱_URL_입력';

// 1. 메모리 캐시 변수 선언
let stockCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 2 * 60 * 1000; // 캐시 유지 시간: 2분 (필요시 조정 가능)

// 전체 재고 데이터를 GAS에서 가져오는 함수
async function getStockData() {
  const now = Date.now();
  // 캐시가 존재하고 2분이 지나지 않았다면 구글 시트를 안 부르고 캐시 리턴!
  if (stockCache && (now - lastFetchTime < CACHE_DURATION)) {
    console.log('⚡ 캐시 데이터 사용 (0.01초 소요)');
    return stockCache;
  }

  // 2분이 지났거나 캐시가 없으면 GAS 호출
  console.log('🔄 구글 시트에서 최신 데이터 조회 중...');
  const response = await axios.get(GAS_URL);
  stockCache = response.data; // 데이터를 메모리에 저장
  lastFetchTime = now;
  return stockCache;
}

app.post('/skill', async (req, res) => {
  try {
    const userUtterance = req.body.userRequest.utterance; // 사용자가 보낸 카톡 메시지
    
    // 제품코드 추출 (예: BC05)
    const match = userUtterance.match(/[A-Za-z]{2}\d{2,4}/); // 알파벳2자리+숫자 패턴
    if (!match) {
      return res.json({
        version: "2.0",
        template: { outputs: [{ simpleText: { text: "제품 코드를 정확히 입력해주세요. (예: BC05)" } }] }
      });
    }

    const itemCode = match[0].toUpperCase();
    const stockData = await getStockData(); // 캐시 적용된 함수 호출

    // stockData 예시: { "BC05": 1123, "BC06": 500 }
    const qty = stockData[itemCode];

    let replyText = "";
    if (qty !== undefined) {
      replyText = `${itemCode} 제품의 현재 남은 재고는 ${qty}개입니다.`;
    } else {
      replyText = `${itemCode} 품목을 찾을 수 없습니다.`;
    }

    // 카카오톡 챗봇 스킬 응답 규격
    return res.json({
      version: "2.0",
      template: {
        outputs: [{ simpleText: { text: replyText } }]
      }
    });

  } catch (error) {
    console.error(error);
    return res.json({
      version: "2.0",
      template: { outputs: [{ simpleText: { text: "재고 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." } }] }
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
