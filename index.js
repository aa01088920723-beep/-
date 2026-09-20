const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbza-8PWxMDCYXdpdwzgw5ydrdSe1YIH_fKcTSuc-kBTrTxHXuoehLgm5PVb8zcM6WIh/exec'; 

app.post('/', async (req, res) => {
    const userMessage = req.body.userRequest ? req.body.userRequest.utterance : "";
    let answerText = "해당 제품의 재고 정보를 찾지 못했습니다. 제품 코드를 다시 확인해 주세요.";

    try {
        const sheetResponse = await axios.get(GOOGLE_SHEET_URL);
        const inventoryData = sheetResponse.data; // { "BC05": 1123, "AB2XS": 23, ... } 형태
        
        let foundCode = null;
        
        // [핵심 개선] 긴 제품 코드부터 먼저 검사하도록 정렬 (예: BC05J, AB2XS 등을 BC05보다 먼저 비교)
        const sortedCodes = Object.keys(inventoryData).sort((a, b) => b.length - a.length);
        
        for (const code of sortedCodes) {
            // 대소문자 구분 없이 사용자가 입력한 문장에 해당 제품 코드가 독립된 단어로 포함되어 있는지 확인
            const regex = new RegExp(code, 'i');
            if (regex.test(userMessage)) {
                foundCode = code;
                break;
            }
        }

        if (foundCode) {
            const qty = inventoryData[foundCode];
            answerText = `${foundCode} 제품의 현재 남은 재고는 ${qty}개입니다.`;
        } else if (userMessage.includes("재고")) {
            answerText = "조회하실 제품 코드(예: AB2XS, BC05 등)를 정확히 함께 말씀해 주세요!";
        }

    } catch (error) {
        console.error(error);
        answerText = "재고 정보를 불러오는 중 오류가 발생했습니다.";
    }

    res.json({
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
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
// 브라우저로 직접 접속했을 때 서버 상태를 확인하기 위한 코드
app.get('/', (req, res) => {
  res.send('Kakao Bot Server is Running!');
});
