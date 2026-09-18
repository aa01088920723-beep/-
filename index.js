const express = require('express');
const axios = require('axios'); // 외부 시트 데이터를 읽기 위한 라이브러리
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// 구글 Apps Script 웹 앱 URL 적용 완료
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbx12xXDaTkocThQinpDswVrc6Z3UfIkLDVIJSjKs-VgheRpHp6bJSU4E_yyrfijz30K/exec';

app.post('/', async (req, res) => {
  const userMessage = req.body.userRequest ? req.body.userRequest.utterance : "";
  let answerText = "해당 제품의 재고 정보를 찾지 못했습니다. 제품 코드를 다시 확인해 주세요.";

  try {
    // 1. 구글 시트에서 실시간 재고 데이터 가져오기
    const sheetResponse = await axios.get(GOOGLE_SHEET_URL);
    const inventoryData = sheetResponse.data; // { "BC05": 15, "BC10": 8, ... } 형태

    // 2. 사용자가 말한 메시지에서 제품 코드 찾기 (시트에 있는 코드 중 메시지에 포함된 것 검색)
    let foundCode = null;
    for (const code of Object.keys(inventoryData)) {
      if (userMessage.includes(code)) {
        foundCode = code;
        break;
      }
    }

    // 3. 찾은 제품에 따라 답변 구성
    if (foundCode) {
      const qty = inventoryData[foundCode];
      answerText = `${foundCode} 제품의 현재 남은 재고는 ${qty}개입니다.`;
    } else if (userMessage.includes("재고")) {
      answerText = "조회하실 제품 코드(예: BC05, BC10 등)를 함께 말씀해 주세요!";
    }

  } catch (error) {
    console.error("구글 시트 연동 에러:", error);
    answerText = "죄송합니다. 현재 재고 정보를 불러오는 중에 문제가 발생했습니다.";
  }

  const responseBody = {
    version: "2.0",
    template: {
      outputs: [
        {
          simpleText: {
            text: answerText
          }
        }
      ]
    }
  };
  res.json(responseBody);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
